const toGeoJSONPoint = (coordinates) => {
  if (!coordinates) return null;

  // Supports either { latitude, longitude } or [longitude, latitude].
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    const [longitude, latitude] = coordinates.map(Number);
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
      return {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }
    return null;
  }

  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
};

const pointToLatLng = (point) => {
  if (!point || point.type !== 'Point' || !Array.isArray(point.coordinates)) {
    return null;
  }

  const [longitude, latitude] = point.coordinates;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return { latitude, longitude };
};

module.exports = {
  toGeoJSONPoint,
  pointToLatLng
};
