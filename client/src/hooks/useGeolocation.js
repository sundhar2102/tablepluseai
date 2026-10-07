import { useState, useEffect, useCallback } from 'react';

/**
 * useGeolocation — manages browser geolocation access with fallbacks.
 */
export function useGeolocation(autoRequest = true) {
  const [coordinates, setCoordinates] = useState(null);
  const [isDeviceLocation, setIsDeviceLocation] = useState(false);
  const [loading, setLoading] = useState(Boolean(autoRequest));
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback((forceFresh = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermissionDenied(true);
      setLoading(false);
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position?.coords?.latitude;
          const lng = position?.coords?.longitude;

          if (
            typeof lat === 'number' &&
            !Number.isNaN(lat) &&
            Number.isFinite(lat) &&
            typeof lng === 'number' &&
            !Number.isNaN(lng) &&
            Number.isFinite(lng)
          ) {
            const newCoords = {
              latitude: lat,
              longitude: lng,
              timestamp: Date.now(),
            };
            setCoordinates(newCoords);
            setIsDeviceLocation(true);
            setLoading(false);
            setPermissionDenied(false);
            setError(null);
            resolve(newCoords);
          } else {
            setLoading(false);
            setError('Invalid coordinates received from GPS.');
            resolve(null);
          }
        },
        (err) => {
          setLoading(false);
          let message = 'Unable to retrieve location.';
          if (err.code === 1) {
            message = 'Location access was denied.';
            setPermissionDenied(true);
          } else if (err.code === 2) {
            message = 'Location information is unavailable.';
          } else if (err.code === 3) {
            message = 'Location request timed out.';
          }
          setError(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: forceFresh ? 0 : 30000,
        }
      );
    });
  }, []);

  const refreshLocation = useCallback(() => {
    return requestLocation(true);
  }, [requestLocation]);

  const setManualCoordinates = useCallback((lat, lng) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isNaN(numLat) && Number.isFinite(numLat) && !Number.isNaN(numLng) && Number.isFinite(numLng)) {
      setCoordinates({
        latitude: numLat,
        longitude: numLng,
        timestamp: Date.now(),
      });
      setIsDeviceLocation(false);
      setPermissionDenied(false);
      setError(null);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setIsDeviceLocation(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation(false);
    }
  }, [autoRequest, requestLocation]);

  return {
    coordinates,
    isDeviceLocation,
    loading,
    error,
    permissionDenied,
    requestLocation,
    refreshLocation,
    setManualCoordinates,
    clearLocation,
  };
}

