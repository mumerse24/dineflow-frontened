import React, { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchGroupOrder, joinGroupOrder } from "@/store/slices/groupOrderSlice"
import { Button } from "@/components/ui/button"
import { Users, ShoppingBag, ArrowRight, Loader2, Utensils, Layers, Wallet, Info } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { socketService } from "@/services/socket"
import { setGroupOrder } from "@/store/slices/groupOrderSlice"
import { GroupOrder, GroupOrderMember } from "@/types"

export default function GroupOrderPage() {
    const { inviteCode } = useParams<{ inviteCode: string }>()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { currentGroupOrder, loading, error } = useAppSelector((state) => state.groupOrder)
    const { isAuthenticated, user } = useAppSelector((state) => state.auth)

    useEffect(() => {
        if (inviteCode) {
            dispatch(fetchGroupOrder(inviteCode))
            
            // Join socket room for real-time updates
            const socket = socketService.connect()
            if (socket) {
                socket.emit("joinGroupOrder", inviteCode)
                socket.on("groupOrderUpdated", (updatedOrder) => {
                    dispatch(setGroupOrder(updatedOrder))
                })
            }
            
            return () => {
                socket?.off("groupOrderUpdated")
            }
        }
    }, [inviteCode, dispatch])

    const handleJoin = async () => {
        if (!isAuthenticated) {
            navigate(location.pathname, { state: { openAuth: true }, replace: true })
            return
        }
        if (inviteCode) {
            try {
                await dispatch(joinGroupOrder(inviteCode)).unwrap()
                toast.success("Joined group order successfully!")
                // After joining, navigate to the restaurant page to add items
                const restaurantId = typeof currentGroupOrder.restaurant === 'object' 
                    ? currentGroupOrder.restaurant._id 
                    : currentGroupOrder.restaurant
                navigate(`/restaurant/${restaurantId}`)
            } catch (err) {
                toast.error("Failed to join group order")
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50/30">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            </div>
        )
    }

    if (error || !currentGroupOrder) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Order Not Found</h1>
                <p className="text-orange-900/60 font-medium mb-8 max-w-md">The group order link you followed is invalid or has expired. Please ask your friend for a new link.</p>
                <Button onClick={() => navigate("/")} className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 px-10 font-black uppercase tracking-widest shadow-2xl shadow-orange-200">
                    Back to Home
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-orange-50/20 flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-orange-100/50 overflow-hidden border border-orange-100">
                    <div className="flex flex-col md:flex-row">
                        {/* Left: Info & Steps */}
                        <div className="md:w-5/12 p-12 bg-orange-600 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl" />
                            
                            <div className="relative">
                                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-10 rotate-6 shadow-xl border border-white/30">
                                    <Users className="w-8 h-8 text-white -rotate-6" />
                                </div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.8] mb-6">
                                    Group<br />Order
                                </h1>
                                <div className="inline-flex flex-col mb-8">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Invite Code</span>
                                    <span className="text-2xl font-black text-white tracking-widest uppercase">{currentGroupOrder.inviteCode}</span>
                                </div>

                                {/* Step-by-step summary for mobile/tablet */}
                                <div className="space-y-4 mt-8 hidden md:block">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
                                        <p className="text-xs font-medium text-white/80">Join the shared cart session</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</div>
                                        <p className="text-xs font-medium text-white/80">Pick your items from the menu</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</div>
                                        <p className="text-xs font-medium text-white/80">Selections merge automatically</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">4</div>
                                        <p className="text-xs font-medium text-white/80">One single checkout for all</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-12 pt-6 border-t border-white/20">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Ordering from</p>
                                <h3 className="text-xl font-black uppercase tracking-tight text-white">{currentGroupOrder.restaurant?.name}</h3>
                            </div>
                        </div>

                        {/* Right: Detailed Steps & Join Action */}
                        <div className="md:w-7/12 p-12 flex flex-col justify-center bg-white">
                            <div className="mb-10">
                                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-[0.9]">
                                    How it<br />works
                                </h2>
                                <div className="h-1.5 w-12 bg-orange-600 rounded-full" />
                            </div>
                            
                            <div className="grid gap-6 mb-12">
                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                                        <Users className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">1. Join shared cart</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            You're added to a group session linked to code <span className="font-bold text-orange-600">{currentGroupOrder.inviteCode}</span>, ordering from <span className="font-bold text-gray-900">{currentGroupOrder.restaurant?.name}</span>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                                        <Utensils className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">2. Browse the menu</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Pick your own items from the restaurant's menu and add them to your personal portion of the cart.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                                        <Layers className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">3. Everyone's items combine</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Your selections merge with your friends (currently {currentGroupOrder.members.length} joined), creating one single combined order.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                                        <Wallet className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">4. One checkout</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Everything goes out as a single order. The host usually places and pays for the final order.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Keep in mind note */}
                            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8 flex gap-4">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <p className="text-[11px] text-amber-900/70 font-bold uppercase tracking-tight leading-relaxed">
                                    Add items before the host closes the cart. You're locked into {currentGroupOrder.restaurant?.name} for this order.
                                </p>
                            </div>

                            <Button 
                                onClick={handleJoin}
                                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-orange-200 flex items-center justify-center gap-4 transition-all active:scale-95 group"
                            >
                                {isAuthenticated ? 'JOIN ORDER' : 'SIGN IN TO JOIN'}
                                <ArrowRight className="w-6 h-6 stroke-[3] transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Combined Selections Section */}
                {currentGroupOrder.members.some((m: GroupOrderMember) => m.items.length > 0) && (
                    <div className="w-full max-w-4xl mt-12">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">🛒 Combined Cart</h2>
                            <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                {currentGroupOrder.members.reduce((sum: number, m: GroupOrderMember) => sum + m.items.length, 0)} Items
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {currentGroupOrder.members.map((member: GroupOrderMember) => (
                                member.items.length > 0 && (
                                    <div key={member.user} className="bg-white rounded-[32px] p-8 shadow-xl shadow-orange-900/5 border border-orange-100/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-black">
                                                    {member.name?.[0] || "U"}
                                                </div>
                                                <h3 className="font-black text-gray-900 uppercase tracking-tight">{member.name || "Guest"}</h3>
                                            </div>
                                            {member.user === user?._id && (
                                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">YOU</span>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {member.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                                                            {item.menuItem?.name || "Loading..."}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                                                    </div>
                                                    <span className="font-black text-orange-600">
                                                        Rs. {((item.menuItem?.price || 0) * item.quantity).toFixed(0)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>

                        {/* Order Summary Summary */}
                        <div className="mt-8 bg-orange-600 rounded-[32px] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl shadow-orange-200">
                            <div>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Total Group Order Value</p>
                                <h3 className="text-4xl font-black tracking-tighter leading-none">
                                    Rs. {currentGroupOrder.members.reduce((total: number, m: GroupOrderMember) => 
                                        total + m.items.reduce((mTotal: number, i: any) => mTotal + (i.menuItem?.price || 0) * i.quantity, 0)
                                    , 0).toFixed(0)}
                                </h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2 text-right">
                                    Wait for the host ({currentGroupOrder.host === user?._id ? "YOU" : "your friend"}) to checkout
                                </p>
                                {currentGroupOrder.host === user?._id && (
                                    <Button className="bg-white text-orange-600 hover:bg-orange-50 font-black uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl border-none">
                                        GO TO CHECKOUT
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
