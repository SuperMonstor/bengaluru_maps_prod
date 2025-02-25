import { useRef, useState } from "react"
import { useLoadScript } from "@react-google-maps/api"

export interface Location {
  id: string
  map_id: string
  creator_id: string
  name: string
  latitude: number
  longitude: number
  google_maps_url: string
  note: string | null
  created_at: string
}

export interface PlaceDetails {
  imageUrl: string | null
  rating: number | null
  isOpenNow: boolean | null
  address: string | null
  phone: string | null
  website: string | null
  todayHours: string | null
}

export const mapStyles = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.man_made", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 70 }],
  },
  { featureType: "water", stylers: [{ color: "#d4e4eb" }] },
]

export function useGoogleMaps(locations: Location[]) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  })

  const defaultCenter = { lat: 12.9542946, lng: 77.4908558 } // Bengaluru fallback

  const getInitialMapSettings = () => {
    if (!locations.length) {
      return { center: defaultCenter, zoom: 12 }
    }

    const latitudes = locations.map((loc) => loc.latitude)
    const longitudes = locations.map((loc) => loc.longitude)
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const center = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    }

    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    const zoom =
      maxDiff > 0
        ? Math.min(15, Math.max(10, Math.floor(15 - Math.log2(maxDiff * 100))))
        : 15

    return { center, zoom }
  }

  const initialSettings = getInitialMapSettings()

  const fetchPlaceDetails = async (googleMapsUrl: string) => {
    const placeIdMatch = googleMapsUrl.match(/place_id:([^&]+)/)
    if (!placeIdMatch || !mapRef.current) {
      setPlaceDetails(null)
      return
    }

    const placeId = placeIdMatch[1]
    const placesService = new google.maps.places.PlacesService(mapRef.current)
    placesService.getDetails(
      { 
        placeId, 
        fields: [
          "photos", 
          "rating", 
          "opening_hours",
          "formatted_address",
          "formatted_phone_number",
          "website"
        ] 
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Get today's opening hours
          let todayHours = null;
          if (place.opening_hours && place.opening_hours.weekday_text) {
            const today = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
            // Adjust index since Google's weekday_text starts with Monday at index 0
            const todayIndex = today === 0 ? 6 : today - 1;
            const fullText = place.opening_hours.weekday_text[todayIndex];
            // Extract just the hours part (e.g., "Monday: 9:00 AM – 10:00 PM" -> "9:00 AM – 10:00 PM")
            todayHours = fullText.split(': ')[1];
          }

          setPlaceDetails({
            imageUrl:
              place.photos?.[0]?.getUrl({ maxWidth: 600, maxHeight: 400 }) ||
              null,
            rating: place.rating || null,
            isOpenNow: place.opening_hours?.isOpen() ?? null,
            address: place.formatted_address || null,
            phone: place.formatted_phone_number || null,
            website: place.website || null,
            todayHours: todayHours
          });
        } else {
          console.error("Place details error:", status);
          setPlaceDetails(null);
        }
      }
    )
  }

  const onMapLoad = (googleMap: google.maps.Map) => {
    mapRef.current = googleMap
  }

  return {
    isLoaded,
    mapRef,
    selectedLocation,
    setSelectedLocation,
    placeDetails,
    fetchPlaceDetails,
    initialSettings,
    onMapLoad,
    mapStyles,
  }
} 