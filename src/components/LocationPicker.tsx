import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip } from "react-leaflet"
import L from "leaflet"
import { Search, MapPin, Navigation, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/services/api"
import "leaflet/dist/leaflet.css"

interface LocationPickerProps {
    onLocationSelect: (location: {
        address: string
        city: string
        coordinates: { lat: number; lng: number }
    }) => void
    initialCoordinates?: { lat: number; lng: number }
    initialLabel?: string
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Custom Pin Icon
const PinIcon = L.divIcon({
    html: `<div class="bg-red-500 p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="width: 40px; height: 40px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    className: "custom-pin-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
})

// Public Landmark Pin Icon
const LandmarkIcon = L.divIcon({
    html: `<div class="bg-indigo-600 p-1.5 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition" style="width: 28px; height: 28px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    className: "custom-landmark-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
})

function MapController({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.setView(center, 16)
    }, [center, map])
    return null
}

function LocationMarker({ position, setPosition, onDragEnd, label }: {
    position: [number, number],
    setPosition: (pos: [number, number]) => void,
    onDragEnd: (pos: [number, number]) => void,
    label: string
}) {
    useMapEvents({
        click(e) {
            const newPos: [number, number] = [e.latlng.lat, e.latlng.lng]
            setPosition(newPos)
            onDragEnd(newPos)
        },
    })

    const markerRef = useRef<L.Marker>(null)
    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current
            if (marker != null) {
                const newPos = marker.getLatLng()
                onDragEnd([newPos.lat, newPos.lng])
            }
        },
    }), [onDragEnd])

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            icon={PinIcon}
            ref={markerRef}
        >
            {label && (
                <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent className="custom-marker-tooltip font-bold text-amber-900 border-amber-500 shadow-md">
                    {label}
                </Tooltip>
            )}
        </Marker>
    )
}

export default function LocationPicker({ onLocationSelect, initialCoordinates, initialLabel }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState(initialLabel || "")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedPos, setSelectedPos] = useState<[number, number]>(
        initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : [34.0151, 71.5805]
    )
    const [searching, setSearching] = useState(false)
    const [reverseGeocoding, setReverseGeocoding] = useState(false)
    const [publicLandmarks, setPublicLandmarks] = useState<any[]>([])

    // Fetch public landmarks
    useEffect(() => {
        const fetchLandmarks = async () => {
            try {
                const res = await api.get("/landmarks")
                if (res.data.success) {
                    setPublicLandmarks(res.data.data)
                }
            } catch (err) {
                console.warn("Failed to fetch public landmarks", err)
            }
        }
        fetchLandmarks()
    }, [])

    // Reverse geocode a coordinate to get address details
    const fetchAddressFromCoords = async (lat: number, lng: number) => {
        setReverseGeocoding(true)
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
            )
            const data = await res.json()
            if (data.features && data.features.length > 0) {
                const feature = data.features[0]
                const context = feature.context || []
                const city = context.find((c: any) => c.id.startsWith("place"))?.text || ""

                onLocationSelect({
                    address: feature.place_name,
                    city: city,
                    coordinates: { lat, lng }
                })
                setSearchQuery(feature.place_name)
            }
        } catch (err) {
            console.error("Reverse geocoding failed:", err)
        } finally {
            setReverseGeocoding(false)
        }
    }

    // Search for addresses
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
            )
            const data = await res.json()
            const features = data.features || []
            setSearchResults(features)

            if (features.length > 0) {
                selectResult(features[0])
            } else {
                alert("Location not found. Try searching for a nearby town or city and then drag the pin to your village!")
            }
        } catch (err) {
            console.error("Search failed:", err)
            alert("Search failed. Please check your internet connection and try again.")
        } finally {
            setSearching(false)
        }
    }

    const selectResult = (result: any) => {
        const [lng, lat] = result.center
        const newPos: [number, number] = [lat, lng]
        setSelectedPos(newPos)
        setSearchResults([])
        setSearchQuery(result.place_name)

        const context = result.context || []
        const city = context.find((c: any) => c.id.startsWith("place"))?.text || ""

        onLocationSelect({
            address: result.place_name,
            city: city,
            coordinates: { lat, lng }
        })
    }

    // Capture initial location if none provided
    useEffect(() => {
        const getGeoLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
                        setSelectedPos(newPos)
                        fetchAddressFromCoords(newPos[0], newPos[1])
                        console.log("📍 Got high accuracy location:", newPos)
                    },
                    (err) => {
                        console.warn("⚠️ Geolocation error (attempting lower accuracy):", err.message)
                        // Retry with lower accuracy if needed, or just log
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                )
            }
        }

        if (!initialCoordinates) {
            getGeoLocation()
        }
    }, [])

    // Sync from parent if changed externally (e.g. Quick Select click)
    useEffect(() => {
        if (initialCoordinates) {
            setSelectedPos([initialCoordinates.lat, initialCoordinates.lng])
        }
    }, [initialCoordinates?.lat, initialCoordinates?.lng])

    useEffect(() => {
        if (initialLabel !== undefined) {
            setSearchQuery(initialLabel)
        }
    }, [initialLabel])

    return (
        <div className="flex flex-col gap-4">
            <div className="relative z-[1001]">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search your area, street, or landmark..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-10 pr-4 h-12 rounded-xl shadow-sm border-slate-200"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
                    </div>
                    <Button onClick={handleSearch} className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2">
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Locate
                    </Button>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[1002]">
                        {searchResults.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => selectResult(result)}
                                className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                            >
                                <MapPin className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">{result.text}</p>
                                    <p className="text-xs text-slate-500 truncate">{result.place_name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative h-[300px] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner group">
                <MapContainer
                    center={selectedPos}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                >
                    <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
                    />
                    <LocationMarker
                        position={selectedPos}
                        setPosition={setSelectedPos}
                        onDragEnd={(pos) => fetchAddressFromCoords(pos[0], pos[1])}
                        label={searchQuery || "Drop Pin Here"}
                    />

                    {/* Render Public Landmarks */}
                    {publicLandmarks.map((landmark) => (
                        <Marker
                            key={landmark._id}
                            position={[landmark.coordinates.lat, landmark.coordinates.lng]}
                            icon={LandmarkIcon}
                            eventHandlers={{
                                click: () => {
                                    // Snap main pin to this landmark
                                    const newPos: [number, number] = [landmark.coordinates.lat, landmark.coordinates.lng]
                                    setSelectedPos(newPos)
                                    setSearchQuery(landmark.name)
                                    onLocationSelect({
                                        address: landmark.name,
                                        city: "",
                                        coordinates: { lat: newPos[0], lng: newPos[1] }
                                    })
                                }
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -15]} opacity={0.9} permanent className="font-bold text-[10px] text-indigo-900 bg-white/95 border border-indigo-200 shadow-md uppercase tracking-wider rounded-md py-1 px-2 whitespace-nowrap">
                                {landmark.name}
                            </Tooltip>
                        </Marker>
                    ))}

                    <MapController center={selectedPos} />
                </MapContainer>

                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="bg-white/90 backdrop-blur rounded-xl shadow-lg border-0 hover:bg-white"
                        onClick={() => {
                            if (!navigator.geolocation) {
                                alert("Geolocation is not supported by your browser.")
                                return
                            }
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
                                    setSelectedPos(newPos)
                                    fetchAddressFromCoords(newPos[0], newPos[1])
                                },
                                (err) => {
                                    console.error("📍 Geolocation Error:", err)
                                    if (err.code === err.PERMISSION_DENIED) {
                                        alert("Location Access Denied! 🛑\n\nPlease click the 'Lock' 🔒 icon in your browser address bar and set 'Location' to 'Allow'.\n\nFallback: You can still search for your address or drag the red pin manually!")
                                    } else {
                                        alert(`Could not detect location: ${err.message}. Please try searching your address manually below.`)
                                    }
                                },
                                { enableHighAccuracy: true, timeout: 5000 }
                            )
                        }}
                    >
                        <Navigation className="w-5 h-5 text-blue-600" />
                    </Button>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Drag the pin to your exact door
                </div>

                {reverseGeocoding && (
                    <div className="absolute inset-0 z-[1001] bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-800 font-bold mb-2 uppercase tracking-tight italic">
                    📍 Give this spot a name (e.g., "My Village House", "Ali's Shop")
                </p>
                <Input
                    placeholder="Enter a name for this location..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        // Also update the parent address field
                        onLocationSelect({
                            address: e.target.value,
                            city: "",
                            coordinates: { lat: selectedPos[0], lng: selectedPos[1] }
                        })
                    }}
                    className="bg-white border-amber-200 focus:ring-amber-500 font-medium"
                />
            </div>
        </div>
    )
}
