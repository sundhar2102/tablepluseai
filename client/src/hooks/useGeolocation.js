import { useState, useEffect, useCallback } from 'react';

/**
 * useGeolocation — manages browser geolocation access with fallbacks.
 */
export function useGeolocation(autoRequest = true) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermissionDenied(true);
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        setPermissionDenied(false);
        setError(null);
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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const setManualCoordinates = useCallback((lat, lng) => {
    setCoordinates({ latitude: Number(lat), longitude: Number(lng) });
    setPermissionDenied(false);
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return {
    coordinates,
    loading,
    error,
    permissionDenied,
    requestLocation,
    setManualCoordinates,
    clearLocation,
  };
}
