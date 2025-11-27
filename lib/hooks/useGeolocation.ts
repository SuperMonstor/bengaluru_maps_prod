"use client"

import { useState, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => void
  clearLocation: () => void
}

/**
 * Hook to get user's current location once (not continuous tracking)
 */
export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  })

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        })
      },
      {
        enableHighAccuracy: false, // Faster, less battery drain
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // Accept cached position up to 5 minutes old
      }
    )
  }, [])

  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      error: null,
      loading: false,
    })
  }, [])

  return {
    ...state,
    getCurrentLocation,
    clearLocation,
  }
}
