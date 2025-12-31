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
    userLocation?: { latitude: number; longitude: number }
    hoveredLocationId?: string | null
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
                // Check if we're on mobile (viewport width < 768px)
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

                if (isMobile) {
                    // On mobile, the bottom sheet covers ~60% of the screen
                    // Calculate offset position and animate directly to it
                    const viewportHeight = window.innerHeight
                    const offsetPixels = viewportHeight * 0.25

                    // Set view first without animation to establish zoom level
                    map.setView([lat, lng], 15, { animate: false })

                    // Calculate offset center - add to y to shift map center down,
                    // which moves the marker up on screen into the visible area
                    const targetPoint = map.latLngToContainerPoint([lat, lng])
                    const offsetPoint = L.point(targetPoint.x, targetPoint.y + offsetPixels)
                    const offsetLatLng = map.containerPointToLatLng(offsetPoint)

                    // Animate smoothly to the offset position
                    map.setView(offsetLatLng, 15, { animate: true, duration: 0.3 })
                } else {
                    map.setView([lat, lng], 15, { animate: true, duration: 0.3 })
                }
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
const createCustomIcon = (isSelected: boolean, isHovered: boolean) => {
    const size = isSelected || isHovered ? 40 : 32
    const backgroundColor = isSelected ? "#3b82f6" : isHovered ? "#FF8C42" : "#FF6A00"

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

const defaultIcon = createCustomIcon(false, false)
const selectedIcon = createCustomIcon(true, false)
const hoveredIcon = createCustomIcon(false, true)

// Custom user location icon (blue circle)
const createUserLocationIcon = () => {
    const size = 36

    return new L.DivIcon({
        className: "custom-user-marker",
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: #3b82f6;
                border: 4px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 12px rgba(59, 130, 246, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            ">
                <div style="
                    width: 12px;
                    height: 12px;
                    background-color: white;
                    border-radius: 50%;
                "></div>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .7;
                    }
                }
            </style>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    })
}

const userLocationIcon = createUserLocationIcon()

export default function OSMMap({
    locations,
    selectedLocation,
    onMarkerClick,
    center,
    zoom,
    userLocation,
    hoveredLocationId,
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
            {/* Base map - CARTO Voyager (no labels) */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            />
            {/* Labels overlay with reduced opacity for lighter appearance */}
            <TileLayer
                url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>'
                opacity={0.5}
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
                            selectedLocation?.id === location.id
                                ? selectedIcon
                                : hoveredLocationId === location.id
                                    ? hoveredIcon
                                    : defaultIcon
                        }
                        eventHandlers={{
                            click: () => onMarkerClick(location),
                        }}
                    />
                ))}
            {userLocation && (
                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={userLocationIcon}
                    zIndexOffset={1000}
                >
                    <Popup>Your location</Popup>
                </Marker>
            )}
        </MapContainer>
    )
}
