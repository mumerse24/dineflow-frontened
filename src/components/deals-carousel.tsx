"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { addToCartServer } from "@/store/slices/cartSlice"
import api from "@/services/api"
import type { MenuItem } from "@/types"

export function DealsCarousel() {
    const [deals, setDeals] = useState<MenuItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [addingToCartId, setAddingToCartId] = useState<string | null>(null)
    const user = useAppSelector((state) => state.auth.user)
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

    const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
    const dispatch = useAppDispatch()

    const fetchDeals = async () => {
        try {
            const response = await api.get("/menu/deals/all?limit=7")
            if (response.data.success) {
                setDeals(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch deals:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchedRef = useRef(false)

    useEffect(() => {
        if (fetchedRef.current) return
        fetchedRef.current = true
        fetchDeals()
    }, [])

    const nextSlide = useCallback(() => {
        if (deals.length === 0) return
        setCurrentIndex((prevIndex) => (prevIndex + 1) % deals.length)
    }, [deals.length])

    const prevSlide = () => {
        if (deals.length === 0) return
        setCurrentIndex((prevIndex) => (prevIndex - 1 + deals.length) % deals.length)
    }

    // Auto-scroll logic
    useEffect(() => {
        if (deals.length > 0) {
            autoScrollTimerRef.current = setInterval(nextSlide, 5000)
        }
        return () => {
            if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current)
        }
    }, [deals.length, nextSlide])

    // Reset timer on manual interaction
    const resetTimer = () => {
        if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current)
            autoScrollTimerRef.current = setInterval(nextSlide, 5000)
        }
    }

    const handleAddToCart = async (deal: MenuItem) => {
        const id = deal._id as string
        setAddingToCartId(id)
        try {
            const restaurantId = typeof deal.restaurant === "object" ? deal.restaurant._id : deal.restaurant
            await dispatch(
                addToCartServer({
                    menuItemId: id,
                    quantity: 1,
                    restaurantId: restaurantId as string,
                })
            ).unwrap()
        } catch (error) {
            console.error("Failed to add deal to cart:", error)
        } finally {
            setAddingToCartId(null)
        }
    }

    const getImageUrl = (deal: MenuItem) => {
        if (deal.images && deal.images.length > 0) {
            const imgPath = deal.images[0]
            if (imgPath.startsWith("http")) return imgPath
            const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"
            return `${backendUrl}/${imgPath.replace(/\\/g, "/")}`
        }
        return "/placeholder.svg"
    }

    if (loading) return null // Hide while loading
    if (deals.length === 0) return null

    return (
        <section className="py-8 bg-gradient-to-b from-amber-50 to-white overflow-hidden relative group">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="relative h-[250px] md:h-[350px] lg:h-[450px] w-full group/slider overflow-hidden rounded-3xl shadow-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 1.1, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="absolute inset-0 w-full h-full cursor-pointer group/item"
                            onClick={() => !isAdmin && handleAddToCart(deals[currentIndex])}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

                            <motion.img
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                src={getImageUrl(deals[currentIndex])}
                                alt={deals[currentIndex].name}
                                className="w-full h-full object-cover"
                            />

                            {/* Info Overlay (Price and Name) */}
                            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 text-white max-w-[80%] md:max-w-lg">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-lg uppercase tracking-tighter">
                                        {deals[currentIndex].name}
                                    </h3>
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <div className="bg-amber-500 text-white px-4 py-1 md:px-6 md:py-2 rounded-full text-lg md:text-2xl font-black shadow-xl border-2 border-white/20">
                                            Rs. {deals[currentIndex].price}
                                        </div>
                                        {deals[currentIndex].originalPrice && deals[currentIndex].originalPrice > deals[currentIndex].price && (
                                            <div className="text-xl text-gray-300 line-through font-bold">
                                                Rs. {deals[currentIndex].originalPrice}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Hover Overlay for Cart info */}
                            {!isAdmin && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-all duration-500 flex flex-col items-center justify-center z-30 backdrop-blur-[2px]">
                                    {addingToCartId === deals[currentIndex]._id ? (
                                        <div className="bg-white text-gray-900 px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 animate-pulse">
                                            <div className="w-5 h-5 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                            ADDING TO CART...
                                        </div>
                                    ) : (
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="bg-amber-600 text-white px-6 py-3 md:px-10 md:py-5 rounded-full text-lg md:text-2xl font-black shadow-2xl flex items-center gap-2 md:gap-3 transform transition-all border-2 md:border-4 border-white/30"
                                        >
                                            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />
                                            ORDER NOW
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Tags overlay */}
                            <div className="absolute top-6 left-6 flex gap-3 z-20">
                                {deals[currentIndex].discountPercentage > 0 && (
                                    <Badge className="bg-red-600 text-white px-5 py-2 text-md font-black shadow-xl flex items-center gap-2 border-none">
                                        <Tag className="w-5 h-5" />
                                        SAVE {deals[currentIndex].discountPercentage}%
                                    </Badge>
                                )}
                                {deals[currentIndex].isFeatured && (
                                    <Badge className="bg-amber-500 text-white px-5 py-2 text-md font-black shadow-xl flex items-center gap-2 border-none hover:bg-amber-600">
                                        <Star className="w-5 h-5 fill-current" />
                                        LIMITED TIME
                                    </Badge>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); resetTimer(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all z-10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); resetTimer(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all z-10"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center mt-6 gap-2">
                    {deals.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setCurrentIndex(idx); resetTimer(); }}
                            className={`h-2 transition-all duration-300 rounded-full ${idx === currentIndex ? "w-8 bg-amber-600 shadow-sm" : "w-2 bg-gray-300 hover:bg-gray-400"
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
