import React, { useState, useEffect } from "react"
import {
    UserCircle,
    ChevronRight,
    CheckCircle2,
    Loader2,
    MessageSquare,
    XCircle,
    History as HistoryIcon,
    Bell,
    Settings,
    Flame,
    MapPin,
    User,
    Phone,
    LifeBuoy,
    Map,
    Banknote,
    Package,
    Navigation,
    Search,
    Filter,
    Download,
    Star,
    AlertTriangle,
    Eye,
    CreditCard,
    Clock
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { AppDispatch, RootState } from "@/store/store"
import {
    fetchRiderOrders,
    fetchRiderProfile,
    updateRiderOrderStatus,
    toggleRiderStatus,
    riderLogout,
    fetchRiderHistory,
    addAssignedOrder,
    notifyRiderArrival
} from "../store/slices/riderSlice"
import socketService from "@/services/socket"
import ChatWindow from "../components/ChatWindow"
import { toast } from "sonner"
import { requestForToken, onMessageListener } from "@/services/firebase"

type Tab = "active" | "history" | "earnings" | "map" | "profile" | "support"
type SubTab = "all" | "pickup" | "delivering"

const ORDER_FLOW = {
    accepted: {
        label: "Complete Pickup",
        next: "picked_up",
    },
    picked_up: {
        label: "Start Delivery",
        next: "on_the_way",
    },
    on_the_way: {
        label: "Complete Delivery",
        next: "delivered",
    },
    out_for_delivery: {
        label: "Complete Delivery",
        next: "delivered",
    },
}

const RiderDashboard = () => {
    const [activeTab, setActiveTab] = useState<Tab>("active")
    const [subTab, setSubTab] = useState<SubTab>("all")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [selectedChatOrder, setSelectedChatOrder] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")

    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const { orders, profile, isLoading } = useSelector((state: RootState) => state.rider)
    const { user: authUser } = useSelector((state: RootState) => state.auth)
    const [history, setHistory] = useState<any[]>([])
    const riderData = JSON.parse(localStorage.getItem("riderData") || "{}")

    // Check for role mismatch
    useEffect(() => {
        if (authUser && authUser.role !== "rider") {
            toast.error("Role Mismatch Detected", {
                description: `You are logged in as a ${authUser.role}. Please login with a Rider account to use this dashboard.`,
                duration: 10000,
                action: {
                    label: "Logout",
                    onClick: () => handleLogout()
                }
            });
        }
    }, [authUser?.role]);

    // Filter active orders based on subtab
    const filteredOrders = orders.filter((order: any) => {
        if (subTab === "all") return true;
        if (subTab === "pickup") return ["accepted"].includes(order.status);
        if (subTab === "delivering") return ["picked_up", "on_the_way", "out_for_delivery"].includes(order.status);
        return true;
    });

    useEffect(() => {
        if (!localStorage.getItem("riderToken")) {
            navigate("/rider/login", { replace: true })
            return
        }
        dispatch(fetchRiderOrders())
        dispatch(fetchRiderProfile())
    }, [dispatch, navigate])

    useEffect(() => {
        const socket = socketService.connect()
        if (socket) {
            socket.on("orderAssignedToRider", (data: { riderId: string; order: any }) => {
                if (data.riderId === riderData?._id || data.riderId === profile?._id) {
                    dispatch(addAssignedOrder(data.order))
                    toast.success("🚀 New Order Assigned!", {
                        description: `Pick up from ${data.order.restaurant?.name || "Restaurant"}`,
                        duration: 10000
                    });
                    try {
                        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play();
                    } catch (e) {
                        console.error("Audio error:", e);
                    }
                }
            })
        }

        // Firebase FCM Registration
        requestForToken();

        // Foreground Notification Listener
        const unsubscribe = onMessageListener((payload: any) => {
            console.log("🔔 Rider Dashboard received FCM:", payload);
            if (payload.data?.type === "NEW_ORDER" || payload.notification?.title?.includes("Order")) {
                dispatch(fetchRiderOrders());
                toast.success(payload.notification?.title || "New Notification", {
                    description: payload.notification?.body,
                });
                try {
                    new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play();
                } catch (e) { console.error("Audio error:", e); }
            }
        });

        return () => {
            const s = socketService.getSocket()
            if (s) s.off("orderAssignedToRider")
            if (unsubscribe) unsubscribe();
        }
    }, [profile?._id, riderData?._id, dispatch])

    useEffect(() => {
        if (activeTab === "history") {
            dispatch(fetchRiderHistory()).then((res: any) => {
                if (res.payload) setHistory(res.payload)
            })
        }
    }, [activeTab, dispatch])

    const handleStatusUpdate = async (orderId: string, status: string) => {
        setUpdatingId(orderId)
        await dispatch(updateRiderOrderStatus({ orderId, status }))
        setUpdatingId(null)
    }

    const handleStatusToggle = async () => {
        if (!profile) return
        const newStatus = profile.riderStatus === "available" ? "offline" : "available"
        await dispatch(toggleRiderStatus(newStatus))
    }

    const handleLogout = () => {
        dispatch(riderLogout())
        navigate("/rider/login", { replace: true })
    }

    const getOrderProgress = (status: string) => {
        switch (status) {
            case "accepted": return 30;
            case "picked_up": return 65;
            case "on_the_way": return 85;
            case "out_for_delivery": return 95;
            default: return 0;
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-800">
            {/* 1. Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-12">
                    {/* Logo styled like fastdrop */}
                    <div className="text-[22px] font-black tracking-tighter text-[#F27C21]">
                        Dine<span className="text-gray-900">Flow</span>
                    </div>

                    {/* Status Pill */}
                    {profile?.riderStatus === "available" && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50">
                            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span className="text-[12px] font-semibold text-[#F27C21]">You're Online — Receiving Orders</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-5">
                    <button className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="w-10 h-10 rounded-full bg-[#F27C21] text-white flex items-center justify-center font-bold shadow-sm">
                            {profile?.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "RH"}
                        </div>
                        <span className="font-bold text-sm hidden sm:block">{profile?.name || "Rider Hero"}</span>
                    </div>
                </div>
            </header>

            {/* 2. Hero Banner */}
            <div className="bg-[#F27C21] w-full pt-10 pb-24 px-8 relative overflow-hidden text-white">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-6 backdrop-blur-sm border border-white/30">
                            <Flame className="w-3.5 h-3.5 text-orange-200" />
                            <span className="text-xs font-semibold">Session Active</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            Ready to deliver,<br />{profile?.name?.split(" ")[0]}!
                        </h1>
                        <p className="text-orange-100 text-sm font-medium mb-8">
                            You have {orders.length} active orders waiting. Let's go!
                        </p>

                        {/* Stats Cards */}
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[140px]">
                                <p className="text-2xl font-black">Rs {profile?.stats?.totalEarnings || 0}</p>
                                <p className="text-xs text-orange-200 mt-1 font-medium">Today's earnings</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[120px]">
                                <p className="text-2xl font-black">{profile?.stats?.totalDeliveries || 0}</p>
                                <p className="text-xs text-orange-200 mt-1 font-medium">Delivered</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[120px]">
                                <p className="text-2xl font-black flex items-center gap-1">4.9 <span className="text-yellow-400 text-xl">★</span></p>
                                <p className="text-xs text-orange-200 mt-1 font-medium">Your rating</p>
                            </div>
                        </div>
                    </div>

                    {/* Session Card */}
                    <div className="bg-white rounded-2xl p-6 text-gray-800 shadow-xl min-w-[280px] text-center">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Session Started</p>
                        <p className="text-lg font-black mb-1">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-orange-500 font-medium mb-6 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Active right now
                        </p>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Main Content Layout */}
            <div className="max-w-[1400px] mx-auto px-8 -mt-12 flex flex-col lg:flex-row items-start gap-8 relative z-10 pb-20">

                {/* Left Sidebar */}
                <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
                    {/* Navigation Menu */}
                    <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="space-y-1 mb-6">
                            <button
                                onClick={() => setActiveTab("active")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${activeTab === "active" ? "bg-orange-50 text-[#F27C21]" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center gap-3 font-semibold text-sm">
                                    <Package className="w-5 h-5" /> Active Orders
                                </div>
                                {orders.length > 0 && (
                                    <div className="w-6 h-6 rounded-full bg-[#F27C21] text-white flex items-center justify-center text-[11px] font-black">
                                        {orders.length}
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${activeTab === "history" ? "bg-orange-50 text-[#F27C21]" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center gap-3 font-semibold text-sm">
                                    <HistoryIcon className="w-5 h-5" /> History
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("earnings")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${activeTab === "earnings" ? "bg-orange-50 text-[#F27C21]" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center gap-3 font-semibold text-sm">
                                    <Banknote className="w-5 h-5" /> Earnings
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("map")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${activeTab === "map" ? "bg-orange-50 text-[#F27C21]" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center gap-3 font-semibold text-sm">
                                    <Map className="w-5 h-5" /> Live Map
                                </div>
                            </button>
                        </div>

                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account</p>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors ${activeTab === "profile" ? "bg-orange-50 text-[#F27C21]" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                <UserCircle className="w-5 h-5" /> My Profile
                            </button>
                            <button
                                onClick={() => setActiveTab("support")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors ${activeTab === "support" ? "bg-red-50 text-red-500" : "text-gray-500 hover:bg-red-50 hover:text-red-500"}`}
                            >
                                <LifeBuoy className="w-5 h-5" /> Support
                            </button>
                        </div>
                    </div>

                    {/* Online Status Toggle */}
                    <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">Online Status</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Receiving orders</p>
                        </div>
                        <button
                            onClick={handleStatusToggle}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${profile?.riderStatus === "available" ? "bg-[#10B981] justify-end" : "bg-gray-200 justify-start"}`}
                        >
                            <motion.div layout className="w-6 h-6 rounded-full bg-white shadow-sm" />
                        </button>
                    </div>

                    {/* Rating Summary Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-black text-[#F27C21]">4.9</p>
                            <div className="flex gap-0.5 mt-1 mb-1">
                                {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-[#F27C21] text-xs">★</span>)}
                            </div>
                            <p className="text-[10px] text-gray-400 font-semibold">From 248 ratings</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">This week</p>
                            <p className="text-[#10B981] font-bold text-sm flex items-center justify-end gap-1 mt-1">▲ 0.2</p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">vs last week</p>
                        </div>
                    </div>
                </aside>

                {/* 4. Main Content Area */}
                <main className="flex-1 w-full bg-transparent">
                    {activeTab === "active" && (
                        <>
                            {/* Header & Sub-tabs */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <h2 className="text-2xl font-black text-gray-900">Active Orders</h2>
                                <div className="flex items-center bg-gray-200/50 p-1 rounded-full border border-gray-200">
                                    <button
                                        onClick={() => setSubTab("all")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${subTab === "all" ? "bg-[#F27C21] text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setSubTab("pickup")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${subTab === "pickup" ? "bg-[#F27C21] text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                                    >
                                        Pickup
                                    </button>
                                    <button
                                        onClick={() => setSubTab("delivering")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${subTab === "delivering" ? "bg-[#F27C21] text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                                    >
                                        Delivering
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("history")}
                                        className="px-4 py-1.5 rounded-full text-xs font-bold text-[#F27C21] hover:bg-white/50 transition-all flex items-center gap-1 ml-1"
                                    >
                                        History <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Orders List */}
                            <div className="space-y-6">
                                {isLoading ? (
                                    <div className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 text-[#F27C21] animate-spin mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium text-sm">Loading orders...</p>
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold">No orders found in this category.</p>
                                    </div>
                                ) : (
                                    filteredOrders.map((order: any) => {
                                        const isUrgent = order.status === "accepted";
                                        const progress = getOrderProgress(order.status);
                                        const flowConfig = ORDER_FLOW[order.status as keyof typeof ORDER_FLOW];

                                        return (
                                            <div key={order._id} className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                                {/* Top Colored Bar */}
                                                <div className={`px-6 py-4 flex items-center justify-between ${isUrgent ? 'bg-[#F27C21] text-white' : 'bg-[#7B7A7A] text-white'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg leading-tight">{order.restaurant?.name || "Restaurant"}</h3>
                                                            <p className="text-xs text-white/80 font-medium">#{order.orderNumber?.slice(-6) || "----"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isUrgent && (
                                                            <span className="px-2.5 py-1 bg-white text-[#F27C21] rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                                                                <Flame className="w-3 h-3" /> URGENT
                                                            </span>
                                                        )}
                                                        <span className="px-2.5 py-1 bg-white/20 text-white border border-white/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                                                        </span>
                                                        {order.paymentInfo?.method === "Cash" && (
                                                            <span className="px-2.5 py-1 bg-[#10B981] text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                                                                <Banknote className="w-3 h-3" /> CASH
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    {/* Progress Bar */}
                                                    <div className="mb-6">
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                            <span>Delivery Progress</span>
                                                            <span className="text-[#F27C21]">{progress}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-orange-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progress}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className="h-full bg-[#F27C21] rounded-full"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                                                                <User className="w-3 h-3" /> CUSTOMER
                                                            </p>
                                                            <p className="font-bold text-gray-900">{order.customer?.name || "Guest User"}</p>
                                                            <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                                                                <Phone className="w-3.5 h-3.5" /> {order.contactInfo?.phone || order.customer?.phone || "N/A"}
                                                            </p>
                                                            <button
                                                                onClick={() => setSelectedChatOrder(order._id)}
                                                                className="text-xs text-[#F27C21] font-bold mt-2 hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <MessageSquare className="w-3 h-3" /> Chat with customer
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#E11D48] uppercase tracking-widest flex items-center gap-1 mb-2">
                                                                <MapPin className="w-3 h-3" /> DELIVERY ADDRESS
                                                            </p>
                                                            <p className="font-medium text-gray-800 text-sm leading-relaxed mb-2 max-w-[90%]">
                                                                {order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : "N/A"}
                                                            </p>
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#F27C21] text-[10px] font-bold rounded-lg border border-orange-100">
                                                                <Navigation className="w-3 h-3" /> ~2.5 km away
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Footer & Actions */}
                                                    <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ORDER TOTAL</p>
                                                            <p className="text-2xl font-black text-gray-900 leading-none mb-1">
                                                                Rs {order.pricing?.total || 0}
                                                            </p>
                                                            <p className="text-xs font-medium text-gray-500">
                                                                {order.paymentInfo?.method} • {order.paymentInfo?.status === "pending" ? "Unpaid" : "Paid"}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                            <button
                                                                disabled={updatingId === order._id}
                                                                onClick={() => handleStatusUpdate(order._id, "cancelled")}
                                                                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Cancel
                                                            </button>

                                                            {["on_the_way", "out_for_delivery"].includes(order.status) && (
                                                                <button
                                                                    disabled={updatingId === order._id}
                                                                    onClick={() => dispatch(notifyRiderArrival(order._id))}
                                                                    className="px-5 py-3 rounded-xl bg-[#10B981] text-white font-bold text-xs hover:brightness-105 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" /> I've Arrived
                                                                </button>
                                                            )}

                                                            {flowConfig && (
                                                                <button
                                                                    disabled={updatingId === order._id}
                                                                    onClick={() => handleStatusUpdate(order._id, flowConfig.next)}
                                                                    className="px-6 py-3 rounded-xl bg-[#F27C21] text-white font-bold text-sm hover:brightness-105 shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"
                                                                >
                                                                    {updatingId === order._id ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            {flowConfig.label} <ChevronRight className="w-4 h-4" />
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "history" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <h2 className="text-2xl font-black text-gray-900">Mission History</h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Order ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-[200px]"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none appearance-none cursor-pointer hover:bg-gray-50"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-orange-500 transition-colors shadow-sm">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {(() => {
                                const filteredHistory = history.filter(order => {
                                    const matchesSearch = !searchQuery || order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesStatus = filterStatus === "all" || order.status.toLowerCase() === filterStatus.toLowerCase();
                                    return matchesSearch && matchesStatus;
                                });

                                if (filteredHistory.length === 0) {
                                    return (
                                        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-400 font-bold">No history available matching your criteria.</p>
                                        </div>
                                    )
                                }

                                return (
                                    <div className="grid gap-6">
                                        {filteredHistory.map((order: any) => {
                                            const isDelivered = order.status === "delivered";
                                            const dateObj = new Date(order.actualDeliveryTime || order.updatedAt);
                                            const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
                                            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                                            return (
                                                <div key={order._id} className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                                                                    Order #{order.orderNumber?.slice(-6) || "----"}
                                                                </span>
                                                                <span className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                                                                    <Clock className="w-4 h-4" /> {formattedDate}, {formattedTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest border flex items-center gap-2 ${isDelivered ? 'bg-green-50 text-green-600 border-green-200' :
                                                                order.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                                                            }`}>
                                                            {isDelivered ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                            {order.status}
                                                        </div>
                                                    </div>

                                                    {/* Grid Details */}
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                                                        {/* Locations */}
                                                        <div className="col-span-1 md:col-span-5 space-y-5">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                                                    <Package className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Restaurant</p>
                                                                    <p className="font-bold text-gray-900 text-base">{order.restaurant?.name || "Restaurant"}</p>
                                                                    <p className="text-sm text-gray-500 font-medium mt-0.5">{order.restaurant?.address?.street || "N/A"}</p>
                                                                </div>
                                                            </div>

                                                            <div className="ml-5 border-l-2 border-dashed border-gray-200 h-6 -my-2" />

                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                                                    <MapPin className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Delivery</p>
                                                                    <p className="font-bold text-gray-900 text-base">{order.customer?.name || "Guest User"}</p>
                                                                    <p className="text-sm text-gray-500 font-medium mt-0.5 max-w-xs">{order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : "N/A"}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="col-span-1 md:col-span-4 bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment Method</p>
                                                                <p className="font-bold text-gray-800 text-sm">{order.paymentInfo?.method === "Cash" ? "Cash on Delivery (COD)" : "Online Payment"}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> Distance & Time</p>
                                                                <p className="font-bold text-gray-800 text-sm">~ 3.2 km • {isDelivered ? "24 mins" : "N/A"}</p>
                                                            </div>
                                                        </div>

                                                        {/* Earnings */}
                                                        <div className="col-span-1 md:col-span-3 flex flex-col items-end justify-center bg-green-50/50 rounded-2xl p-5 border border-green-100/50 text-right">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Earnings</p>
                                                            <p className="text-3xl font-black text-[#10B981]">
                                                                Rs {order.pricing?.deliveryFee || 0}
                                                            </p>
                                                            {order.paymentInfo?.method === "Cash" && (
                                                                <p className="text-[10px] font-bold text-orange-500 mt-2 bg-orange-100 px-2.5 py-1 rounded-md">
                                                                    Collected Rs {order.pricing?.total} Cash
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Footer Options */}
                                                    <div className="pt-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {isDelivered && (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-xl border border-yellow-100">
                                                                    <div className="flex text-yellow-400">
                                                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-yellow-700">"Excellent and fast delivery!"</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                            <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5 flex-1 md:flex-none justify-center">
                                                                <AlertTriangle className="w-4 h-4" /> Report Issue
                                                            </button>
                                                            <button className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors flex items-center gap-1.5 flex-1 md:flex-none justify-center shadow-lg shadow-gray-900/20">
                                                                <Eye className="w-4 h-4" /> View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {activeTab === "earnings" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Earnings Overview</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4 border border-green-100">
                                        <Banknote className="w-6 h-6 text-green-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Earnings</p>
                                    <p className="text-3xl font-black text-gray-900">Rs {profile?.stats?.totalEarnings || 0}</p>
                                </div>
                                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="w-12 h-12 bg-[#F27C21]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#F27C21]/20">
                                        <Package className="w-6 h-6 text-[#F27C21]" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Deliveries</p>
                                    <p className="text-3xl font-black text-gray-900">{profile?.stats?.totalDeliveries || 0}</p>
                                </div>
                                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
                                        <Banknote className="w-6 h-6 text-red-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cash to Remit</p>
                                    <p className="text-3xl font-black text-gray-900">Rs {profile?.stats?.pendingCashToRemit || 0}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
                                <div className="relative z-10">
                                    <Banknote className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-gray-800 mb-2">Detailed Analytics</h3>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto">Weekly charts, trends, and detailed withdrawal history are being generated and will be available soon.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "map" && (
                        <div className="space-y-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-black text-gray-900">Live Area Map</h2>
                                <span className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-full text-[10px] uppercase font-black flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" /> GPS ACTIVE
                                </span>
                            </div>
                            <div className="w-full min-h-[500px] bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blue-50" />
                                <div className="absolute inset-0 flex items-center justify-center flex-col z-10 bg-white/40 backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center mb-6">
                                        <Map className="w-10 h-10 text-blue-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">Locating Satellites...</h3>
                                    <p className="text-gray-600 font-medium mt-2 max-w-xs text-center">Establishing secure connection to the routing grid to display high-demand hotspots.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Rider Profile</h2>
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent" />
                                <div className="w-32 h-32 rounded-[2rem] bg-[#F27C21] mx-auto mb-8 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 border border-orange-200 relative z-10">
                                    <UserCircle className="w-16 h-16" />
                                </div>
                                <h2 className="text-gray-900 text-3xl font-black mb-1 relative z-10">{profile?.name || "Rider Name"}</h2>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.15em] mb-10 flex items-center justify-center gap-2 relative z-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {profile?.email || "rider@example.com"}
                                </p>

                                <div className="grid grid-cols-2 gap-6 text-left relative z-10">
                                    <div className="bg-gray-50 rounded-[1.75rem] p-6 border border-gray-100 hover:border-orange-200 transition-colors">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Service ID</p>
                                        <p className="text-gray-900 text-lg font-mono font-bold tracking-tight">#{profile?._id?.slice(-8).toUpperCase() || "--------"}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-[1.75rem] p-6 border border-gray-100 hover:border-orange-200 transition-colors">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Phone</p>
                                        <p className="text-gray-900 text-lg font-mono font-bold tracking-tight">{profile?.phone || "Not set"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "support" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">HQ Support Center</h2>
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mt-20 -mr-20" />
                                <LifeBuoy className="w-20 h-20 text-red-400 mx-auto mb-6 relative z-10" />
                                <h3 className="text-3xl font-black text-gray-900 mb-3 relative z-10">Emergency Dispatch</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-10 relative z-10 font-medium">If you are in an emergency or need immediate assistance with a live order, tap below to open a direct line to dispatch.</p>

                                <button className="px-10 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-red-500/30 transition-all relative z-10 flex items-center justify-center gap-2 mx-auto">
                                    <Phone className="w-5 h-5" /> Connect to HQ
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* In-App Chat Layer */}
            <AnimatePresence>
                {selectedChatOrder && profile && (
                    <ChatWindow
                        orderId={selectedChatOrder}
                        userId={profile._id || (profile as any).id}
                        userName={profile.name}
                        userRole="rider"
                        onClose={() => setSelectedChatOrder(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default RiderDashboard;
