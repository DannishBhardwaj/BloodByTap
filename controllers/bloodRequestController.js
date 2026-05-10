const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { findNearbyDonorsForHospital } = require('./donorController');
const { emitBloodRequestAlert } = require('../services/socketService');
const { geocodeAddress } = require('../utils/geocoding');
const { toGeoJSONPoint, pointToLatLng } = require('../utils/geojson');
const IN_PROGRESS_REQUEST_STATUSES = ['ongoing', 'in-process', 'active'];

const createBloodRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const institution = await User.findById(req.user._id);
    if (!institution || institution.role !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can create blood requests' });
    }

    const {
      bloodType,
      quantity,
      urgency = 'high',
      notes,
      radiusMeters = 5000,
      location,
      hospitalName
    } = req.body;

    let requestPoint = location?.type === 'Point'
      ? location
      : toGeoJSONPoint(location?.coordinates);

    if (!requestPoint && location?.address) {
      const geocoded = await geocodeAddress(location.address);
      requestPoint = toGeoJSONPoint(geocoded);
    }

    if (!requestPoint) {
      requestPoint = institution.institutionProfile?.location
        || toGeoJSONPoint(institution.institutionProfile?.address?.coordinates);
    }

    if (!requestPoint) {
      return res.status(400).json({
        message: 'Location is required. Provide coordinates/address or set institution location.'
      });
    }

    const bloodRequest = await BloodRequest.create({
      institutionId: institution._id,
      hospitalName: hospitalName || institution.institutionProfile?.name || 'Hospital',
      bloodType,
      quantity,
      urgency,
      notes,
      radiusMeters,
      location: {
        ...requestPoint,
        address: location?.address || institution.institutionProfile?.address?.street
      }
    });

    const center = pointToLatLng(requestPoint);
    const nearbyDonors = await findNearbyDonorsForHospital({
      latitude: center.latitude,
      longitude: center.longitude,
      radius: radiusMeters,
      bloodType
    });

    bloodRequest.matchedDonors = nearbyDonors.map((donor) => ({
      donorId: donor._id,
      userId: donor.user?._id,
      distance: donor.distance,
      notifiedAt: new Date(),
      status: 'pending'
    }));

    await bloodRequest.save();

    const io = req.app.get('io');
    const socketStats = emitBloodRequestAlert(io, {
      ...bloodRequest.toObject(),
      entityType: 'blood-request'
    }, nearbyDonors);

    return res.status(201).json({
      message: 'Blood request created and nearby donors alerted',
      bloodRequest,
      nearbyDonorsFound: nearbyDonors.length,
      socketDelivery: socketStats
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create blood request',
      error: error.message
    });
  }
};

const listBloodRequests = async (req, res) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status === 'active'
        ? { $in: IN_PROGRESS_REQUEST_STATUSES }
        : req.query.status;
    }

    if (req.query.institutionId) {
      query.institutionId = req.query.institutionId;
    }

    const bloodRequests = await BloodRequest.find(query)
      .populate('institutionId', 'email institutionProfile.name')
      .sort({ createdAt: -1 });

    return res.json({ bloodRequests });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch blood requests', error: error.message });
  }
};

const respondToBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can respond to blood requests' });
    }

    const { response } = req.body;
    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ message: 'Response must be accepted or rejected' });
    }

    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (!IN_PROGRESS_REQUEST_STATUSES.includes(bloodRequest.status)) {
      return res.status(400).json({ message: 'Blood request is not in progress' });
    }

    const donorMatch = bloodRequest.matchedDonors.find((match) =>
      match.userId?.toString() === req.user._id.toString()
    );

    if (!donorMatch) {
      return res.status(403).json({ message: 'You were not notified for this blood request' });
    }

    donorMatch.status = response;
    donorMatch.respondedAt = new Date();

    bloodRequest.status = 'ongoing';
    await bloodRequest.save();

    return res.json({
      message: `Blood request response recorded: ${response}`,
      bloodRequest
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to respond to blood request', error: error.message });
  }
};

const completeBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can complete blood requests' });
    }

    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.institutionId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this blood request' });
    }

    bloodRequest.status = 'complete';
    bloodRequest.fulfilledBy = req.body.fulfilledBy || null;
    bloodRequest.fulfilledAt = new Date();
    await bloodRequest.save();

    return res.json({
      message: 'Blood request marked as complete',
      bloodRequest
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete blood request', error: error.message });
  }
};

module.exports = {
  createBloodRequest,
  listBloodRequests,
  respondToBloodRequest,
  completeBloodRequest
};
