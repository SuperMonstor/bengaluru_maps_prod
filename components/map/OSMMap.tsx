"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import L from "leaflet"
import { Location } from "@/lib/types/mapTypes"

interface OSMMapProps {
    locations: Location[]
    selectedLocation: Location | null
    onMarkerClick: (location: Location) => void
    center?: { lat: number; lng: number }
    zoom?: number
}

// Component to handle map bounds and center updates
function MapController({
    locations,
    selectedLocation,
    center,
    zoom,
}: {
    locations: Location[]
    selectedLocation: Location | null
    center?: { lat: number; lng: number }
    zoom?: number
}) {
    const map = useMap()

    useEffect(() => {
        if (selectedLocation) {
            map.flyTo(
                [selectedLocation.latitude, selectedLocation.longitude],
                15,
                {
                    duration: 1.5,
                }
            )
        } else if (center && zoom) {
            map.setView([center.lat, center.lng], zoom)
        } else if (locations.length > 0) {
            const bounds = L.latLngBounds(
                locations.map((loc) => [loc.latitude, loc.longitude])
            )
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [locations, selectedLocation, center, zoom, map])

    return null
}

// Custom icons
const defaultIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const selectedIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [30, 49], // Slightly larger
    iconAnchor: [15, 49],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

export default function OSMMap({
    locations,
    selectedLocation,
    onMarkerClick,
    center,
    zoom,
}: OSMMapProps) {
    // Default center (Bengaluru) if no locations or center provided
    const defaultCenter: [number, number] = [12.9716, 77.5946]
    const defaultZoom = 12

    return (
        <MapContainer
            center={center ? [center.lat, center.lng] : defaultCenter}
            zoom={zoom || defaultZoom}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController
                locations={locations}
                selectedLocation={selectedLocation}
                center={center}
                zoom={zoom}
            />
            {locations
                .filter((location) => location.is_approved)
                .map((location) => (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        icon={
                            selectedLocation?.id === location.id ? selectedIcon : defaultIcon
                        }
                        eventHandlers={{
                            click: () => onMarkerClick(location),
                        }}
                    />
                ))}
        </MapContainer>
    )
}
