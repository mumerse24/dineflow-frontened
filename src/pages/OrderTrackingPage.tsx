import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Clipboard, MapPin, Phone, Bike, Package, CheckCircle2, MessageSquare, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import api from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "@/store"
import ChatWindow from "../components/ChatWindow"
import { toast } from "sonner"
import socketService from "@/services/socket"
import { getProfile } from "@/store/thunks/authThunks"
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { onMessageListener, requestForToken } from "@/services/firebase"

// Leaflet Icons (Upgraded to Crisp SVGs)
const restaurantIcon = L.divIcon({
  html: `<div style="background-color: #f97316; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(249, 115, 22, 0.4);">
           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
         </div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const customerIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);">
           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
         </div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const getRiderIcon = (bearing: number) => L.divIcon({
  html: `<div style="position: relative; width: 54px; height: 54px; display: flex; justify-content: center; align-items: center;">
           <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 3px solid #f97316; animation: pulse-ring 1.5s ease-out infinite;"></div>
           <div style="background-color: #10b981; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 3px solid white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5); transform: rotate(${bearing}deg); transition: transform 0.1s linear;">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6a3.5 3.5 0 0 0-3 5.83"></path><path d="M5.5 14H9l3-7h5"></path></svg>
           </div>
         </div>`,
  className: '',
  iconSize: [54, 54],
  iconAnchor: [27, 27],
});

function getBearing(start: [number, number], end: [number, number]) {
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  // Calculate bearing and convert to degrees. 
  // Add 90 or adjust because standard bearing vs map coordinate system might differ slightly, but let's test this raw bearing first.
  // Actually, standard math uses x, y but map is lng(x), lat(y).
  let bearing = Math.atan2(dx, dy) * (180 / Math.PI);
  // Standard map bearing 0 is North. dx (lng) and dy (lat).
  // When going East (dx > 0, dy = 0), bearing is 90.
  // We want the icon to point correctly. Our SVG bike might point right (90 deg naturally) or up.
  // We'll adjust the icon SVG if it points weirdly, or add an offset.
  return bearing;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

// Camera Follow Component
const CameraFollow = ({ position, isTracking }: { position: [number, number], isTracking: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (isTracking) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, isTracking, map]);
  return null;
}

// The Upgraded Dummy Tracking Component
const DummyTrackingMap = ({ isTracking, isDelivered }: { isTracking: boolean, isDelivered: boolean }) => {
  const restaurantPos: [number, number] = [24.8607, 67.0011];
  const customerPos: [number, number] = [24.8750, 67.0150];
  
  const [riderPos, setRiderPos] = useState<[number, number]>(restaurantPos);
  const [bearing, setBearing] = useState<number>(0);
  const [pathCoords, setPathCoords] = useState<[number, number][]>([restaurantPos]);
  const [speed, setSpeed] = useState<number>(0);
  const [eta, setEta] = useState<number>(15);

  useEffect(() => {
    if (isDelivered) {
      setRiderPos(customerPos);
      setPathCoords([restaurantPos, customerPos]);
      setSpeed(0);
      setEta(0);
      return;
    }

    if (isTracking && !isDelivered) {
      let startTime: number | null = null;
      let animationFrameId: number;
      const duration = 60000; // 60s demo

      let lastPos = restaurantPos;
      let lastTime = 0;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        let progress = (timestamp - startTime) / duration;
        if (progress > 1) progress = 1;

        // Smooth easing: easeInOutCubic
        const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const lat = restaurantPos[0] + (customerPos[0] - restaurantPos[0]) * easeProgress;
        const lng = restaurantPos[1] + (customerPos[1] - restaurantPos[1]) * easeProgress;
        
        const newPos: [number, number] = [lat, lng];
        
        if (lastPos[0] !== newPos[0] || lastPos[1] !== newPos[1]) {
            setBearing(getBearing(lastPos, newPos));
            
            if (timestamp - lastTime > 1000) {
                // Update speed and ETA every second to avoid flickering
                const distSinceLast = getDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
                const timeHours = (timestamp - lastTime) / 3600000;
                const instSpeed = Math.min(Math.round(distSinceLast / timeHours), 65); // Cap to 65km/h
                setSpeed(instSpeed > 0 ? instSpeed : speed);

                const remainingDist = getDistance(newPos[0], newPos[1], customerPos[0], customerPos[1]);
                const avgSpeed = 40; 
                setEta(Math.max(1, Math.round((remainingDist / avgSpeed) * 60)));
                
                lastTime = timestamp;
                lastPos = newPos;
            }
        }

        setRiderPos(newPos);

        setPathCoords((prev) => {
          const last = prev[prev.length - 1];
          if (!last || getDistance(last[0], last[1], lat, lng) > 0.02) {
             return [...prev, newPos];
          }
          return prev;
        });

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
            setSpeed(0);
            setEta(0);
        }
      };
      
      animationFrameId = requestAnimationFrame(step);

      return () => {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    } else {
        setRiderPos(restaurantPos)
        setPathCoords([restaurantPos]);
        setSpeed(0);
    }
  }, [isTracking, isDelivered]);

  const pulseCSS = `
    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 1; border-width: 4px; }
      100% { transform: scale(1.6); opacity: 0; border-width: 1px; }
    }
  `;

  return (
    <div className="w-full h-full relative bg-gray-100">
      <style>{pulseCSS}</style>
      <MapContainer 
        center={[(restaurantPos[0] + customerPos[0]) / 2, (restaurantPos[1] + customerPos[1]) / 2]} 
        zoom={14} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
          maxZoom={19}
        />
        
        {/* Full Path Guidance Line */}
        <Polyline positions={[restaurantPos, customerPos]} color="#9ca3af" weight={3} opacity={0.4} dashArray="8, 8" />
        
        {/* Live Traveled Path */}
        <Polyline positions={pathCoords} color="#f97316" weight={5} opacity={0.9} />
        
        <Marker position={restaurantPos} icon={restaurantIcon} />
        <Marker position={customerPos} icon={customerIcon} />
        {(isTracking || isDelivered) && <Marker position={riderPos} icon={getRiderIcon(bearing)} />}
        
        {isTracking && !isDelivered && <CameraFollow position={riderPos} isTracking={isTracking} />}
      </MapContainer>
      
      {/* Top Overlay for Speed & ETA */}
      {isTracking && !isDelivered && (
        <div className="absolute top-6 left-6 right-6 z-[20] flex justify-between pointer-events-none">
           <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
               <span className="text-sm font-black text-gray-800 tracking-widest">{speed} <span className="text-[10px] text-gray-500">KM/H</span></span>
           </div>
           <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center min-w-[80px]">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ETA</span>
               <span className="text-sm font-black text-orange-500">{eta} <span className="text-[10px]">MIN</span></span>
           </div>
        </div>
      )}

      {/* Overlay Status inside Map */}
      <div className="absolute bottom-6 left-6 right-6 z-[20] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4">
        <div className={`p-3 rounded-full ${isDelivered ? 'bg-green-100 text-green-600' : isTracking ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            {isDelivered ? <CheckCircle2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
        </div>
        <div>
            <p className="font-black text-gray-900 leading-tight">{isDelivered ? "Successfully Delivered" : isTracking ? "Rider is heading your way" : "Waiting for pickup..."}</p>
            <p className="text-xs text-gray-500 font-bold mt-1">{isDelivered ? "Enjoy your meal!" : isTracking ? "Arriving shortly. Track live movement." : "Restaurant is preparing your order"}</p>
        </div>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const { user } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<AppDispatch>()

    // Simulation Mode State (Demo Only)
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationIdx, setSimulationIdx] = useState(0);

    const handleSimulate = () => {
        if (isSimulating) {
            setIsSimulating(false);
            setSimulationIdx(0);
            return;
        }

        setIsSimulating(true);
        let current = 0;
        const interval = setInterval(() => {
            current += 1;
            if (current >= 4) {
                clearInterval(interval);
                setIsSimulating(false);
                setSimulationIdx(0);
                toast.success("Simulation Complete!");
            } else {
                setSimulationIdx(current);
            }
        }, 3000); // Progress every 3 seconds for demo
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/orders/${id}`)
                if (res.data.success) {
                    setOrder(res.data.data)
                } else {
                    setError("Order not found")
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load order")
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchOrder()
    }, [id])

    useEffect(() => {
        if (!id || !order) return;
        if (["delivered", "cancelled", "rejected", "refunded"].includes(order.status)) return;

        const pollStatus = setInterval(async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                if (res.data.success) {
                    const newOrder = res.data.data;
                    if (newOrder.status === "delivered" && order.status !== "delivered") {
                        toast.success("Order delivered! Points awarded.");
                        dispatch(getProfile());
                    }
                    setOrder(newOrder);
                    if (["delivered", "cancelled", "rejected", "refunded"].includes(newOrder.status)) {
                        clearInterval(pollStatus);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 15000);

        return () => clearInterval(pollStatus);
    }, [id, order?.status, dispatch]);

    useEffect(() => {
        if (!order) return;
        const socket = socketService.connect();
        if (socket) {
            socket.on("orderStatusUpdated", (updatedOrder: any) => {
                if (updatedOrder._id === order._id) {
                    setOrder(updatedOrder);
                    if (updatedOrder.status === "delivered") dispatch(getProfile());
                }
            });

            socket.on("riderArrived", (data: { orderId: string }) => {
                if (data.orderId === order._id) {
                    toast.success("🚚 Rider has arrived!", {
                        description: "Your rider is waiting outside.",
                        duration: 8000
                    });
                    try {
                        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play();
                    } catch (e) { console.error("Audio error:", e); }
                }
            });
        }

        // Firebase Foreground Notification for Arrival
        const unsubscribe = onMessageListener((payload: any) => {
            console.log("🔔 Tracking Page received FCM:", payload);
            if (payload.data?.type === "RIDER_ARRIVED" && payload.data?.orderId === order._id) {
                toast.success(payload.notification?.title || "Rider Arrived", {
                    description: payload.notification?.body,
                    duration: 8000
                });
                try {
                    new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play();
                } catch (e) { console.error("Audio error:", e); }
            }
        });

        // Request token for customer to receive push notifications
        requestForToken();

        return () => {
            const s = socketService.getSocket();
            if (s) {
                s.off("orderStatusUpdated");
                s.off("riderArrived");
            }
            if (unsubscribe) unsubscribe();
        };
    }, [order?._id, dispatch]);

    const copyToClipboard = () => {
        if (order) {
            navigator.clipboard.writeText(order.orderNumber || order._id)
            toast.success("Order ID copied!")
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Syncing Logistics...</p>
            </div>
        </div>
    )

    if (error || !order) return (
        <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gray-50">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-8 max-w-xs font-medium">{error || "Mission data could not be retrieved."}</p>
            <Button onClick={() => navigate(-1)} className="rounded-full px-8 bg-orange-500 hover:bg-orange-600">Return to HQ</Button>
        </div>
    )

    const orderDate = new Date(order.createdAt).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
    })

    const getStatusIndex = (status: string) => {
        const statuses = ['pending', 'confirmed', 'preparing', 'on_the_way', 'out_for_delivery', 'delivered']
        const idx = statuses.indexOf(status)
        if (idx === 0) return 0 // Placed
        if (idx === 1 || idx === 2) return 1 // Confirmed
        if (idx === 3 || idx === 4) return 2 // On the way
        if (idx === 5) return 3 // Delivered
        return 0
    }

    const currentIdx = getStatusIndex(order.status)
    const steps = [
        { label: "Placed", icon: Check },
        { label: "Confirmed", icon: Check },
        { label: "On the way", icon: Bike },
        { label: "Delivered", icon: Package },
    ]

    const serviceFee = 130
    const subtotal = order.pricing?.subtotal || 0
    const taxAmount = (subtotal * 0.08)
    const deliveryFee = order.pricing?.deliveryFee || 150
    const total = (order.pricing?.total || 0) + serviceFee

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-4 py-12 md:py-16">
            {/* Convert to 2-column grid to hold Map and Receipt side by side */}
            <div className="w-full max-w-6xl grid xl:grid-cols-2 gap-8 items-start">
                
                {/* Left: The Map Component */}
                <div className="order-2 xl:order-1 h-[500px] xl:h-[700px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative xl:sticky top-6">
                    <DummyTrackingMap 
                        isTracking={isSimulating ? simulationIdx >= 2 : currentIdx >= 2} 
                        isDelivered={isSimulating ? simulationIdx >= 3 : currentIdx >= 3} 
                    />
                </div>

                {/* Right: The Existing Receipt */}
                <div className="order-1 xl:order-2 w-full max-w-lg mx-auto self-start">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    {/* Header */}
                    <div className="bg-orange-500 p-8 text-white relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-white hover:bg-white/10">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">Order Receipt</h1>
                                    <p className="text-orange-100 text-sm mt-1 opacity-90">{order.restaurant?.name || "Restaurant"} - {orderDate}</p>
                                </div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                                <span className="text-xs font-bold uppercase tracking-wider">{order.status.replace(/_/g, " ")}</span>
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="mt-10 flex items-center justify-between relative px-2">
                            <div className="absolute top-5 left-10 right-10 h-[2px] bg-white/20 -z-0" />
                            {steps.map((step, idx) => {
                                // In simulation mode, we use simulationIdx, otherwise we use currentIdx
                                const isStepActive = isSimulating ? idx <= simulationIdx : idx <= currentIdx;
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isStepActive ? 'bg-white text-orange-500 border-white shadow-lg' : 'bg-transparent text-white/40 border-white/20'}`}>
                                            <step.icon className={`w-5 h-5 ${isStepActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isStepActive ? 'text-white' : 'text-white/40'}`}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Simulation Control (Demo Only) */}
                        <div className="mt-6 flex justify-center">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleSimulate}
                                className={`rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all ${isSimulating ? 'bg-white text-orange-500 border-white' : 'bg-orange-600 text-white border-white/20 hover:bg-orange-700'}`}
                            >
                                {isSimulating ? `Simulating Phase ${simulationIdx + 1}...` : "Start Demo Simulation"}
                            </Button>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-8">
                        {/* Customer Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Phone</p>
                                <p className="text-sm font-black text-gray-900">{order.contactInfo?.phone || "N/A"}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Order type</p>
                                <p className="text-sm font-black text-gray-900 capitalize">{order.orderType || "Delivery"}</p>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <MapPin className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                                <p className="text-xs font-bold text-gray-800 leading-relaxed italic">
                                    {order.deliveryAddress?.street || "N/A"}<br />
                                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state || "Punjab"}
                                </p>
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-gray-100" />

                        {/* Ordered Items */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Ordered Items</p>
                            {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] font-black border border-orange-100">
                                            {item.quantity}x
                                        </div>
                                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">Rs {item.price * item.quantity}</p>
                                </div>
                            ))}
                        </div>

                        <div className="h-[1px] w-full bg-gray-100" />

                        {/* Pricing Breakdown */}
                        <div className="space-y-3 px-1">
                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                <span>Subtotal</span>
                                <span>Rs {subtotal}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                <span>Delivery fee</span>
                                <span>Rs {deliveryFee}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                <span>Service fee</span>
                                <span>Rs {serviceFee}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                <span>Tax (8%)</span>
                                <span>Rs {Math.round(taxAmount)}</span>
                            </div>
                            <div className="pt-3 flex justify-between items-end">
                                <span className="text-sm font-black text-gray-800">Total</span>
                                <span className="text-2xl font-black text-orange-500">Rs {Math.round(total)}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                    <Package className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-bold text-gray-700">{order.paymentInfo?.method || "Cash on delivery"}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.paymentInfo?.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                Payment {order.paymentInfo?.status || "pending"}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <Button 
                                onClick={() => setIsChatOpen(true)}
                                className="rounded-2xl h-12 bg-orange-500 text-white hover:bg-orange-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Live Chat
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => navigate('/contact')}
                                className="rounded-2xl h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 font-black text-xs uppercase tracking-widest shadow-sm"
                            >
                                Need help?
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-4">
                            <p className="text-[10px] font-bold text-gray-400 italic">Thank you for ordering with us!</p>
                            <div className="flex items-center justify-center gap-2 mt-2 group cursor-pointer" onClick={copyToClipboard}>
                                <p className="text-[9px] font-mono font-bold text-gray-300 tracking-tighter uppercase">#{order.orderNumber || order._id} - Generated {new Date().toLocaleTimeString()}</p>
                                <Clipboard className="w-3 h-3 text-gray-200 group-hover:text-orange-400 transition-colors" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isChatOpen && user && order && (
                    <ChatWindow
                        orderId={order._id}
                        userId={user._id || (user as any).id}
                        userName={user.name}
                        userRole="customer"
                        onClose={() => setIsChatOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
