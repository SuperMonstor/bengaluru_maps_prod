"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useGeolocation } from "@/lib/hooks/useGeolocation"
import { useLoadScript } from "@react-google-maps/api"

interface UserLocationContextValue {
	latitude: number | null
	longitude: number | null
	locationName: string | null
	loading: boolean
	error: string | null
	isManual: boolean
	setManualLocation: (lat: number, lng: number, name: string) => void
	clearLocation: () => void
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(
	undefined
)

export function useUserLocation() {
	const context = useContext(UserLocationContext)
	if (context === undefined) {
		throw new Error(
			"useUserLocation must be used within UserLocationProvider"
		)
	}
	return context
}

interface UserLocationProviderProps {
	children: ReactNode
}

/**
 * Global location provider that manages user's location across the entire app.
 * Automatically requests device location on mount.
 * Provides methods to manually set or clear location.
 */
export function UserLocationProvider({ children }: UserLocationProviderProps) {
	// Load Google Maps API globally
	const { isLoaded: isMapsLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
		libraries: ["places"],
	})

	const {
		latitude: deviceLat,
		longitude: deviceLng,
		loading: deviceLoading,
		error: deviceError,
		getCurrentLocation,
		clearLocation: clearDeviceLocation,
	} = useGeolocation()

	// Manual location state
	const [manualLocation, setManualLocationState] = useState<{
		lat: number
		lng: number
		name: string
	} | null>(null)

	// Location name from reverse geocoding (for device location)
	const [deviceLocationName, setDeviceLocationName] = useState<string | null>(null)

	// Auto-request location on mount
	useEffect(() => {
		getCurrentLocation()
	}, [getCurrentLocation])

	// Reverse geocode device location to get name
	useEffect(() => {
		if (deviceLat !== null && deviceLng !== null && !manualLocation && isMapsLoaded) {
			// Reverse geocode to get location name
			reverseGeocode(deviceLat, deviceLng)
		}
	}, [deviceLat, deviceLng, manualLocation, isMapsLoaded])

	const reverseGeocode = async (lat: number, lng: number) => {
		try {
			// Check if Google Maps API is available
			if (!isMapsLoaded || typeof google === 'undefined' || !google.maps) {
				console.log("Google Maps API not loaded yet")
				setDeviceLocationName(null)
				return
			}

			const geocoder = new google.maps.Geocoder()
			const result = await geocoder.geocode({
				location: { lat, lng },
			})

			if (result.results[0]) {
				// Get the most relevant address component (neighborhood or locality)
				const addressComponents = result.results[0].address_components
				const neighborhood = addressComponents.find(c =>
					c.types.includes('neighborhood') || c.types.includes('sublocality')
				)
				const locality = addressComponents.find(c => c.types.includes('locality'))

				const name = neighborhood?.long_name || locality?.long_name || result.results[0].formatted_address
				setDeviceLocationName(name)
			}
		} catch (error) {
			console.error("Reverse geocoding failed:", error)
			setDeviceLocationName(null)
		}
	}

	const setManualLocation = (lat: number, lng: number, name: string) => {
		setManualLocationState({ lat, lng, name })
	}

	const clearLocation = () => {
		setManualLocationState(null)
		clearDeviceLocation()
	}

	// Use manual location if set, otherwise use device location
	const latitude = manualLocation?.lat ?? deviceLat
	const longitude = manualLocation?.lng ?? deviceLng
	const locationName = manualLocation?.name ?? deviceLocationName
	const loading = !manualLocation && deviceLoading
	const error = !manualLocation ? deviceError : null
	const isManual = manualLocation !== null

	return (
		<UserLocationContext.Provider
			value={{
				latitude,
				longitude,
				locationName,
				loading,
				error,
				isManual,
				setManualLocation,
				clearLocation,
			}}
		>
			{children}
		</UserLocationContext.Provider>
	)
}
