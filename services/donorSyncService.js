const Donor = require('../models/Donor');
const { toGeoJSONPoint } = require('../utils/geojson');

const upsertDonorFromUser = async (user) => {
  if (!user || user.role !== 'donor') {
    return null;
  }

  const profile = user.donorProfile || {};
  const geoPoint = profile.location || toGeoJSONPoint(profile.address?.coordinates);

  if (!geoPoint || !profile.bloodType) {
    return null;
  }

  const donorPayload = {
    user: user._id,
    bloodType: profile.bloodType,
    age: profile.age,
    isAvailable: profile.isAvailable !== false,
    location: geoPoint,
    phone: profile.phone,
    healthStatus: profile.healthStatus,
    lastDonationDate: profile.lastDonationDate
  };

  return Donor.findOneAndUpdate(
    { user: user._id },
    donorPayload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  upsertDonorFromUser
};
