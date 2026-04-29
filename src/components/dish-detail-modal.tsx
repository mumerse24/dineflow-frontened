"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, Star, Clock, ShoppingCart,
    MessageSquare, Send, CheckCircle2,
    AlertCircle, ShieldCheck
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { addToCartServer } from "@/store/slices/cartSlice"
import api from "@/services/api"
import type { MenuItem, Review } from "@/types"
import { toast } from "sonner"

interface DishDetailModalProps {
    dish: MenuItem | null
    isOpen: boolean
    onClose: () => void
}

export function DishDetailModal({ dish, isOpen, onClose }: DishDetailModalProps) {
    const dispatch = useAppDispatch()
    const { user, isAuthenticated } = useAppSelector((state) => state.auth)
    const [reviews, setReviews] = useState<Review[]>([])
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [newRating, setNewRating] = useState(5)
    const [newComment, setNewComment] = useState("")
    const [submittingReview, setSubmittingReview] = useState(false)
    const [activeTab, setActiveTab] = useState<"details" | "customise" | "reviews">("details")
    const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
    const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<string>(dish?.spiceLevel || "Mild")
    const [selectedToppings, setSelectedToppings] = useState<any[]>([])
    const [specialNote, setSpecialNote] = useState("")

    useEffect(() => {
        if (isOpen && dish) {
            fetchReviews()
            setActiveTab("details")
            setRemovedIngredients([])
            setSelectedSpiceLevel(dish.spiceLevel || "Mild")
            setSelectedToppings([])
            setSpecialNote("")
        }
    }, [isOpen, dish])

    const fetchReviews = async () => {
        if (!dish) return
        setLoadingReviews(true)
        try {
            const response = await api.get(`/reviews/${dish._id}`)
            if (response.data.success) {
                setReviews(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error)
        } finally {
            setLoadingReviews(false)
        }
    }

    const handleAddToCart = async () => {
        if (!dish) return
        try {
            const restaurantId = typeof dish.restaurant === "object" ? dish.restaurant._id : dish.restaurant
            
            // Format customizations for the backend
            const customizations = selectedToppings.map(t => ({
                name: "Extra Toppings",
                selectedOptions: [{ name: t.name, price: t.price }]
            }))

            await dispatch(
                addToCartServer({
                    menuItemId: dish._id,
                    quantity: 1,
                    restaurantId: restaurantId as string,
                    specialInstructions: specialNote,
                    customizations: customizations,
                    removedIngredients: removedIngredients,
                    spiceLevel: selectedSpiceLevel as any
                })
            ).unwrap()
            toast.success(`${dish.name} added with customizations!`)
            onClose()
        } catch (error) {
            toast.error("Failed to add to cart")
        }
    }

    const toggleIngredient = (ing: string) => {
        setRemovedIngredients(prev => 
            prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
        )
    }

    const toggleTopping = (topping: any) => {
        setSelectedToppings(prev => 
            prev.some(t => t.name === topping.name) 
                ? prev.filter(t => t.name !== topping.name) 
                : [...prev, topping]
        )
    }

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isAuthenticated) {
            toast.error("Please login to leave a review")
            return
        }
        if (!newComment.trim()) return

        setSubmittingReview(true)
        try {
            const response = await api.post("/reviews", {
                menuItemId: dish?._id,
                rating: newRating,
                comment: newComment
            })

            if (response.data.success) {
                toast.success("Review submitted! Thank you.")
                setNewComment("")
                setNewRating(5)
                fetchReviews()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit review")
        } finally {
            setSubmittingReview(false)
        }
    }

    const getImageUrl = (item: MenuItem) => {
        let imgPath = null;
        if (item.images && item.images.length > 0) {
            imgPath = item.images[0];
        } else if (item.image) {
            imgPath = item.image;
        }

        if (!imgPath) {
            return "/placeholder.svg";
        }

        let pathName = imgPath;
        if (imgPath.startsWith('http') && !imgPath.includes('placehold')) {
            try {
                const parsedUrl = new URL(imgPath);
                if (parsedUrl.pathname.startsWith('/images/')) {
                    pathName = parsedUrl.pathname;
                } else {
                    return imgPath; // External image
                }
            } catch (e) {
                return imgPath;
            }
        }

        const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
        const formattedPath = pathName.replace(/\\/g, "/");
        return formattedPath.startsWith('/') ? `${backendUrl}${formattedPath}` : `${backendUrl}/${formattedPath}`;
    }

    if (!dish) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent aria-describedby={undefined} aria-labelledby={undefined} className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl sm:rounded-3xl">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Left: Image & Quick Info */}
                    <div className="md:w-1/2 relative h-[300px] md:h-auto">
                        <img
                            src={getImageUrl(dish)}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-4 left-4 flex gap-2">
                            {dish.isDeal && (
                                <Badge className="bg-orange-600 text-white border-none px-3 py-1 font-bold">
                                    🔥 HOT DEAL
                                </Badge>
                            )}
                            {dish.isPopular && (
                                <Badge className="bg-orange-400 text-white border-none px-3 py-1 font-bold">
                                    ⭐ POPULAR
                                </Badge>
                            )}
                        </div>

                        <div className="absolute bottom-6 left-6 text-white">
                            <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">
                                {dish.name}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center text-orange-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < Math.round(dish.rating?.average || 0) ? 'fill-current' : 'text-gray-400'}`} />
                                    ))}
                                    <span className="ml-2 text-sm font-bold text-white">
                                        {dish.rating?.average.toFixed(1) || "New"}
                                    </span>
                                </div>
                                <span className="text-white/80 text-sm font-medium">
                                    • {dish.rating?.count || 0} reviews
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Details & Reviews */}
                    <div className="md:w-1/2 flex flex-col bg-white">
                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Tabs */}
                            <div className="flex bg-orange-50/50 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setActiveTab("details")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "details" ? 'bg-white shadow-sm text-orange-600' : 'text-orange-400/60 hover:text-orange-600'}`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab("customise")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "customise" ? 'bg-white shadow-sm text-orange-600' : 'text-orange-400/60 hover:text-orange-600'}`}
                                >
                                    Customise
                                </button>
                                <button
                                    onClick={() => setActiveTab("reviews")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "reviews" ? 'bg-white shadow-sm text-orange-600' : 'text-orange-400/60 hover:text-orange-600'}`}
                                >
                                    Reviews ({reviews.length})
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === "details" ? (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-2">Description</h4>
                                            <p className="text-gray-600 leading-relaxed font-medium">
                                                {dish.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                                <div className="flex items-center gap-2 text-orange-700 mb-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-black uppercase">Delivery Time</span>
                                                </div>
                                                <span className="text-lg font-black text-gray-900">{dish.preparationTime || "25-30 mins"}</span>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                                <div className="flex items-center gap-2 text-orange-700 mb-1">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    <span className="text-xs font-black uppercase">Dietary</span>
                                                </div>
                                                <span className="text-lg font-black text-gray-900">
                                                    {dish.dietaryTags?.[0] || "Standard"}
                                                </span>
                                            </div>
                                        </div>

                                        {dish.ingredients && dish.ingredients.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">What's Inside</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {dish.ingredients.map((ing, i) => (
                                                        <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-100">
                                                            + {ing}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : activeTab === "customise" ? (
                                    <motion.div
                                        key="customise"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-6"
                                    >
                                        {/* Remove Ingredients */}
                                        {dish.ingredients && dish.ingredients.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">Remove Ingredients</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {dish.ingredients.map((ing, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => toggleIngredient(ing)}
                                                            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${removedIngredients.includes(ing) ? 'bg-red-50 border-red-200 text-red-600 line-through opacity-60' : 'bg-orange-50 border-orange-100 text-orange-700'}`}
                                                        >
                                                            {removedIngredients.includes(ing) ? 'Remove ' : ''}{ing}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Spice Level */}
                                        <div>
                                            <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">Choose Spice Level</h4>
                                            <div className="flex gap-2">
                                                {["Mild", "Medium", "Hot", "Extra Hot"].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setSelectedSpiceLevel(level)}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${selectedSpiceLevel === level ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-orange-50 border-orange-100 text-orange-600'}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Extra Toppings */}
                                        {dish.customizations && dish.customizations.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">Add Extra Toppings</h4>
                                                <div className="space-y-2">
                                                    {dish.customizations.flatMap(c => c.options).map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => toggleTopping(opt)}
                                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedToppings.some(t => t.name === opt.name) ? 'bg-orange-600 border-orange-600 text-white' : 'bg-orange-50 border-orange-100 text-orange-700'}`}
                                                        >
                                                            <span className="text-sm font-bold">{opt.name}</span>
                                                            <span className="text-sm font-black">+ Rs. {opt.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Special Note */}
                                        <div>
                                            <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3">Add a Note</h4>
                                            <Textarea
                                                placeholder="e.g. No onions please... 📝"
                                                value={specialNote}
                                                onChange={(e) => setSpecialNote(e.target.value)}
                                                className="bg-orange-50 border-orange-100 rounded-xl min-h-[80px] focus:bg-white focus:ring-orange-500"
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="reviews"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-6"
                                    >
                                        {/* Review Form */}
                                        {isAuthenticated ? (
                                            <form onSubmit={handleSubmitReview} className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                                <h5 className="text-sm font-black text-orange-900 mb-3 uppercase tracking-tight">Add Your Review</h5>
                                                <div className="flex gap-1 mb-3 text-orange-400">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setNewRating(star)}
                                                            className={`transition-all ${star <= newRating ? 'text-orange-500' : 'text-orange-200'}`}
                                                        >
                                                            <Star className={`w-6 h-6 ${star <= newRating ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    placeholder="Tell us what you loved... 😋"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="bg-white border-orange-100 mb-3 rounded-xl min-h-[80px] focus:ring-orange-500"
                                                />
                                                <Button
                                                    disabled={submittingReview || !newComment.trim()}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 font-black uppercase tracking-widest"
                                                >
                                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                                </Button>
                                            </form>
                                        ) : (
                                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                                                <p className="text-sm font-bold text-orange-800 uppercase tracking-tight">Please login to write a review! ⭐</p>
                                            </div>
                                        )}

                                        {/* Review List */}
                                        <div className="space-y-4">
                                            {loadingReviews ? (
                                                <div className="flex justify-center p-8">
                                                    <div className="w-6 h-6 border-4 border-orange-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-orange-100" />
                                                </div>
                                            ) : reviews.length > 0 ? (
                                                reviews.map((rev) => (
                                                    <div key={rev._id} className="border-b border-orange-50 pb-4 last:border-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-black text-gray-900 text-sm uppercase tracking-tight">{rev.userName}</span>
                                                            <div className="flex gap-0.5 text-orange-500">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-orange-100'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-600 text-sm leading-relaxed font-medium">{rev.comment}</p>
                                                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-orange-200">
                                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm font-black uppercase tracking-widest">No reviews yet. Be the first!</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer: Price & Add to Cart */}
                        <div className="p-6 bg-orange-50/30 border-t border-orange-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Total Price</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-orange-600 tracking-tighter">Rs. {dish.price}</span>
                                    {dish.originalPrice && dish.originalPrice > dish.price && (
                                        <span className="text-sm text-orange-300 line-through font-bold">Rs. {dish.originalPrice}</span>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={handleAddToCart}
                                className="bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] px-10 h-16 font-black shadow-2xl shadow-orange-200 flex items-center gap-3 transform active:scale-95 transition-all text-lg uppercase tracking-widest"
                            >
                                <ShoppingCart className="w-6 h-6 stroke-[3]" />
                                ADD TO CART
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
