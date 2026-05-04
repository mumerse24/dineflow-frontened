import { useState, useEffect } from "react"
import api from "@/services/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Trash2, Loader2, Navigation } from "lucide-react"
import LocationPicker from "@/components/LocationPicker"
import { Badge } from "./ui/badge"

interface Landmark {
    _id: string;
    name: string;
    coordinates: { lat: number, lng: number };
    isActive: boolean;
    createdAt: string;
}

export function AdminLandmarks() {
    const [landmarks, setLandmarks] = useState<Landmark[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [newLandmarkLocation, setNewLandmarkLocation] = useState<{
        address: string;
        city: string;
        coordinates: { lat: number; lng: number };
    } | null>(null)

    const fetchLandmarks = async () => {
        try {
            const res = await api.get("/landmarks")
            if (res.data.success) {
                setLandmarks(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch landmarks", error)
            toast.error("Failed to load landmarks")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLandmarks()
    }, [])

    const handleSaveLandmark = async () => {
        if (!newLandmarkLocation || !newLandmarkLocation.address || !newLandmarkLocation.coordinates) {
            toast.error("Please pick a location and give it a name")
            return
        }

        setSaving(true)
        try {
            const token = sessionStorage.getItem("adminToken")
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

            const res = await api.post("/landmarks", {
                name: newLandmarkLocation.address, // Inherit name from LocationPicker input
                coordinates: newLandmarkLocation.coordinates
            }, config)

            if (res.data.success) {
                toast.success("Landmark saved successfully!")
                setNewLandmarkLocation(null)
                fetchLandmarks()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save landmark")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this landmark?")) return

        try {
            const token = sessionStorage.getItem("adminToken")
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            const res = await api.delete(`/landmarks/${id}`, config)
            if (res.data.success) {
                toast.success("Landmark deleted")
                fetchLandmarks()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete landmark")
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm border-t-4 border-t-amber-500">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-amber-500" />
                        Add New Public Landmark
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Drop a pin and name it (e.g., "Grand Hospital", "University Campus"). This location will permanently appear in the map for all customers to choose easily.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LocationPicker
                        onLocationSelect={(loc) => setNewLandmarkLocation(loc)}
                        initialLabel=""
                    />
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSaveLandmark}
                            disabled={saving || !newLandmarkLocation?.address}
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px]"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Landmark"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Active Landmarks ({landmarks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                    ) : landmarks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>No public landmarks created yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {landmarks.map(landmark => (
                                <div key={landmark._id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-md transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-amber-500" />
                                                {landmark.name}
                                            </h3>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg mt-3 flex items-center justify-between">
                                            <p className="text-xs text-slate-500 font-mono">
                                                {landmark.coordinates.lat.toFixed(4)}, {landmark.coordinates.lng.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">Active POI</Badge>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(landmark._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
