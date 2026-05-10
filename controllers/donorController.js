const { getDistance } = require('geolib');
const Donor = require('../models/Donor');

const parseGeoInput = ({ latitude, longitude, radius }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const radiusMeters = Number(radius || 5000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: 'Valid latitude and longitude are required' };
  }

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return { error: 'Radius must be a positive number in meters' };
  }

  return {
    center: { latitude: lat, longitude: lng },
    radiusMeters
  };
};

const findNearbyDonorsForHospital = async ({ latitude, longitude, radius = 5000, bloodType }) => {
  const parsed = parseGeoInput({ latitude, longitude, radius });
  if (parsed.error) {
    throw new Error(parsed.error);
  }

  const donorQuery = {
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parsed.center.longitude, parsed.center.latitude]
        },
        $maxDistance: parsed.radiusMeters
      }
    }
  };

  if (bloodType) {
    donorQuery.bloodType = bloodType;
  }

  const donors = await Donor.find(donorQuery)
    .populate('user', 'email role donorProfile.firstName donorProfile.lastName donorProfile.phone donorProfile.bloodType')
    .lean();

  return donors.map((donor) => {
    const [donorLng, donorLat] = donor.location.coordinates;
    const distance = getDistance(
      parsed.center,
      { latitude: donorLat, longitude: donorLng }
    );

    return {
      ...donor,
      distance
    };
  });
};

const findNearbyDonors = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, bloodType } = req.query;

    const donors = await findNearbyDonorsForHospital({
      latitude,
      longitude,
      radius,
      bloodType
    });

    return res.json({
      count: donors.length,
      radiusMeters: Number(radius),
      donors: donors.map((donor) => ({
        donorId: donor._id,
        userId: donor.user?._id,
        bloodType: donor.bloodType,
        age: donor.age,
        distance: donor.distance,
        location: donor.location,
        user: donor.user
      }))
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to find nearby donors',
      error: error.message
    });
  }
};

module.exports = {
  findNearbyDonors,
  findNearbyDonorsForHospital
};
