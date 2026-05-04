import axios from 'axios';

/**
 * OSRM Routing Service
 * Fetches real road paths, ETA, and distance between points.
 */

interface LatLng {
    lat: number;
    lng: number;
}

interface RouteResponse {
    polyline: [number, number][];
    distance: number; // in km
    duration: number; // in minutes
}

class OSRMService {
    private lastRequestTime: number = 0;
    private throttleMs: number = 5000; // 5 second throttle for OSRM public API

    /**
     * Get a route between restaurant, current rider position, and customer.
     * Format: restaurant -> rider -> customer
     */
    async getRoute(restaurant: LatLng, rider: LatLng, customer: LatLng): Promise<RouteResponse> {
        const now = Date.now();
        if (now - this.lastRequestTime < this.throttleMs) {
            throw new Error('Throttled: Requesting too frequently');
        }

        try {
            this.lastRequestTime = now;
            
            // Format: lng,lat;lng,lat
            const coords = `${rider.lng},${rider.lat};${customer.lng},${customer.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

            const response = await axios.get(url);

            if (response.data.code !== 'Ok') {
                throw new Error('OSRM Route Failed');
            }

            const route = response.data.routes[0];
            const distance = route.distance / 1000;

            // SANITY CHECK: If distance is > 50km, it's likely a coordinate mismatch (e.g. Karachi vs Gujrat)
            if (distance > 50) {
                console.warn(`🚩 Distance ${distance}km is too high for local delivery. Using straight-line fallback.`);
                return {
                    polyline: [[rider.lat, rider.lng], [customer.lat, customer.lng]],
                    distance: this.calculateHaversine(rider, customer),
                    duration: 15
                };
            }

            const polyline = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]); // GeoJSON is [lng, lat], Leaflet is [lat, lng]

            return {
                polyline,
                distance: parseFloat(distance.toFixed(2)),
                duration: Math.ceil(route.duration / 60)
            };
        } catch (error) {
            console.error('OSRM Service Error:', error);
            // Fallback: Return a simple straight line if routing fails
            return {
                polyline: [[rider.lat, rider.lng], [customer.lat, customer.lng]],
                distance: this.calculateHaversine(rider, customer),
                duration: 15 // Default fallback duration
            };
        }
    }

    /**
     * Simple Haversine formula for straight-line distance fallback
     */
    private calculateHaversine(point1: LatLng, point2: LatLng): number {
        const R = 6371; // Earth radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return parseFloat((R * c).toFixed(2));
    }
}

export default new OSRMService();
