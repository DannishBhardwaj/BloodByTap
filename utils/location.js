const { getDistance, isPointWithinRadius } = require('geolib');

/**
 * Calculate distance between two coordinates in meters
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {Number} Distance in meters
 */
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || !coord1.latitude || !coord1.longitude || 
      !coord2.latitude || !coord2.longitude) {
    return null;
  }
  
  return getDistance(
    { latitude: coord1.latitude, longitude: coord1.longitude },
    { latitude: coord2.latitude, longitude: coord2.longitude }
  );
};

/**
 * Check if a point is within a radius of another point
 * @param {Object} center - {latitude, longitude}
 * @param {Object} point - {latitude, longitude}
 * @param {Number} radius - Radius in meters
 * @returns {Boolean}
 */
const isWithinRadius = (center, point, radius) => {
  if (!center || !point || !center.latitude || !center.longitude || 
      !point.latitude || !point.longitude) {
    return false;
  }
  
  return isPointWithinRadius(
    { latitude: center.latitude, longitude: center.longitude },
    { latitude: point.latitude, longitude: point.longitude },
    radius
  );
};

/**
 * Find users within a radius using MongoDB geospatial query
 * This is more efficient for large datasets
 * @param {Object} coordinates - {latitude, longitude}
 * @param {Number} radius - Radius in meters
 * @returns {Object} MongoDB query
 */
const getNearbyQuery = (coordinates, radius) => {
  return {
    'location.coordinates': {
      $geoWithin: {
        $centerSphere: [
          [coordinates.longitude, coordinates.latitude],
          radius / 6378100 // Convert meters to radians (Earth's radius in meters)
        ]
      }
    }
  };
};

/**
 * Filter users by distance (for post-query filtering if needed)
 * @param {Array} users - Array of user objects
 * @param {Object} center - {latitude, longitude}
 * @param {Number} maxRadius - Maximum radius in meters
 * @returns {Array} Filtered users with distance property
 */
const filterByDistance = (users, center, maxRadius) => {
  return users
    .map(user => {
      const coords = user.getCoordinates();
      if (!coords) return null;
      
      const distance = calculateDistance(center, coords);
      if (distance === null || distance > maxRadius) return null;
      
      return {
        ...user.toObject(),
        distance
      };
    })
    .filter(user => user !== null)
    .sort((a, b) => a.distance - b.distance);
};

module.exports = {
  calculateDistance,
  isWithinRadius,
  getNearbyQuery,
  filterByDistance
};
