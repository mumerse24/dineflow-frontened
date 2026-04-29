import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchGroupOrder, joinGroupOrder } from "@/store/slices/groupOrderSlice"
import { Button } from "@/components/ui/button"
import { Users, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function GroupOrderPage() {
    const { inviteCode } = useParams<{ inviteCode: string }>()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { currentGroupOrder, loading, error } = useAppSelector((state) => state.groupOrder)
    const { isAuthenticated, user } = useAppSelector((state) => state.auth)

    useEffect(() => {
        if (inviteCode) {
            dispatch(fetchGroupOrder(inviteCode))
        }
    }, [inviteCode, dispatch])

    const handleJoin = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to join the group order")
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
                <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl shadow-orange-100/50 overflow-hidden border border-orange-100">
                    <div className="flex flex-col md:flex-row">
                        {/* Left: Info */}
                        <div className="md:w-1/2 p-12 bg-orange-600 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl" />
                            
                            <div className="relative">
                                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-10 rotate-6 shadow-xl border border-white/30">
                                    <Users className="w-8 h-8 text-white -rotate-6" />
                                </div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.8] mb-6">
                                    Group<br />Order
                                </h1>
                                <div className="inline-flex flex-col">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Invite Code</span>
                                    <span className="text-2xl font-black text-white tracking-widest uppercase">{currentGroupOrder.inviteCode}</span>
                                </div>
                            </div>

                            <div className="relative mt-12 pt-6 border-t border-white/20">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Ordering from</p>
                                <h3 className="text-xl font-black uppercase tracking-tight text-white">{currentGroupOrder.restaurant?.name}</h3>
                            </div>
                        </div>

                        {/* Right: Join */}
                        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-8 leading-[0.9]">
                                You've been<br />invited!
                            </h2>
                            
                            <div className="space-y-6 mb-12">
                                <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                                    </div>
                                    <p className="text-sm font-black text-orange-900 uppercase tracking-tight">
                                        {currentGroupOrder.members.length} friends joined
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    Join the group to add your favorite items to the shared cart. Everyone's picks will appear in one single order.
                                </p>
                            </div>

                            <Button 
                                onClick={handleJoin}
                                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-orange-200 flex items-center justify-center gap-4 transition-all active:scale-95 group"
                            >
                                JOIN ORDER
                                <ArrowRight className="w-6 h-6 stroke-[3] transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
