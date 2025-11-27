"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet"
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
            const lat = Number(selectedLocation.latitude)
            const lng = Number(selectedLocation.longitude)

            // Validate coordinates before animating to location
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                map.setView([lat, lng], 15, {
                    animate: true,
                })
            }
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

// Custom premium circular icons using divIcon for full control
const createCustomIcon = (isSelected: boolean) => {
    const size = isSelected ? 40 : 32
    const backgroundColor = isSelected ? "#3b82f6" : "#FF6A00"

    return new L.DivIcon({
        className: "custom-map-marker",
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${backgroundColor};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                transition: all 200ms ease;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
                </svg>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    })
}

const defaultIcon = createCustomIcon(false)
const selectedIcon = createCustomIcon(true)

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
            zoomControl={false}
        >
            <ZoomControl position="bottomright" />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
