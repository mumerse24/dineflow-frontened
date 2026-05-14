"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchAllMenuItems, resetPagination } from "@/store/slices/menuSlice"
import { socketService } from "@/services/socket"
import RestaurantMenu from "@/components/restaurant-menu"
import { MenuItemModal } from "@/components/menu-item-modal"
import { Plus, Search, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setOrderType } from "@/store/slices/cartSlice"
import type { Filters, MenuItem } from "@/types"
import api from "@/services/api"

// ✅ Initial Filters
const initialFilters: Filters = {
  categories: [],
  rating: "",
  price: "",
  cuisines: []
}

export default function MenuPage() {
  const dispatch = useAppDispatch()
  const { items: menuItems, isLoading, isLoadingMore, hasMore, page } = useAppSelector((state) => state.menu)

  // Auth check for Admin
  const authUser = useAppSelector((state) => state.auth.user)
  const isAdmin = authUser?.role === "admin" || authUser?.role === "superadmin"

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // ✅ IntersectionObserver ref for infinite scroll
  const observerRef = useRef<HTMLDivElement>(null)

  // ✅ Dynamic Categories state
  const [dynamicCategories, setDynamicCategories] = useState([
    { id: "All", name: "All Items", icon: "🍽️" },
    { id: "Popular", name: "Popular", icon: "⭐" },
    { id: "Special Deals", name: "Special Deals", icon: "🔥" },
  ])

  const ICON_MAPPING: Record<string, string> = {
    "Burgers": "🍔",
    "Pizza": "🍕",
    "Sides": "🍟",
    "Beverages": "🥤",
    "Chinese": "🍜",
    "Desi": "🍛",
    "Fast Food": "🍕",
    "Biryani": "🥘",
    "Pasta": "🍝",
    "Desserts": "🍰",
    "Sea Food": "🦞"
  }

  // ✅ Initial data load (page 1)
  useEffect(() => {
    dispatch(fetchAllMenuItems({ page: 1, limit: 12, reset: true }))

    // Fetch dynamic categories from backend
    const fetchCategories = async () => {
      try {
        const response = await api.get("/menu/categories/list")
        if (response.data.success) {
          const categoryNames = response.data.data
          const fixedCats = [
            { id: "All", name: "All Items", icon: "🍽️" },
            { id: "Popular", name: "Popular", icon: "⭐" },
            { id: "Special Deals", name: "Special Deals", icon: "🔥" },
          ]
          
          const fetchedCats = categoryNames
            .filter((name: string) => name !== "Special Deals") // Already in fixedCats
            .map((name: string) => ({
              id: name,
              name: name,
              icon: ICON_MAPPING[name] || "🍽️"
            }))

          setDynamicCategories([...fixedCats, ...fetchedCats])
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()

    const socket = socketService.connect()
    if (socket) {
      socket.on("menuItemAdded", (item: MenuItem) => {
        dispatch(fetchAllMenuItems({ page: 1, limit: 12, reset: true }))
      })
      socket.on("menuItemUpdated", (item: MenuItem) => {
        dispatch(fetchAllMenuItems({ page: 1, limit: 12, reset: true }))
      })
      socket.on("menuItemDeleted", (id: string) => {
        dispatch(fetchAllMenuItems({ page: 1, limit: 12, reset: true }))
      })
    }

    return () => {
      if (socket) {
        socket.off("menuItemAdded")
        socket.off("menuItemUpdated")
        socket.off("menuItemDeleted")
      }
    }
  }, [dispatch])

  // ✅ Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      dispatch(fetchAllMenuItems({ page: page + 1, limit: 12, reset: false }))
    }
  }, [dispatch, isLoading, isLoadingMore, hasMore, page])

  // ✅ IntersectionObserver for infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = observerRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
      observer.disconnect()
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId === "All") {
      setFilters(prev => ({ ...prev, categories: [] }))
    } else {
      setFilters(prev => ({ ...prev, categories: [categoryId] }))
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleAddNewItem = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="pt-20 bg-[#fff9f5]">
        {/* Premium Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="relative h-auto py-12 sm:py-0 sm:h-[420px] flex items-center overflow-hidden rounded-3xl sm:rounded-[48px] bg-gradient-to-br from-[#FF5C00] via-[#FF7A00] to-[#FF4D00] shadow-2xl shadow-orange-900/20">
            {/* Decorative Patterns */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-black rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="px-6 md:px-12 lg:px-24 w-full relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tighter leading-[0.9] drop-shadow-2xl">
                  Welcome back,<br />
                  <span className="text-white/80">{authUser?.name?.split(' ')[0] || 'Foodie'}!</span>
                </h1>
                <p className="text-white/90 text-base sm:text-lg md:text-xl font-bold mb-6 sm:mb-10 leading-relaxed max-w-lg">
                  What's on your mind today? We've got the best deals ready for you.
                </p>

                {/* Search Bar Group - Matches Screenshot Precisely */}
                <div className="flex flex-col sm:flex-row gap-3 p-2.5 bg-white/10 backdrop-blur-md rounded-[32px] max-w-xl border border-white/20 shadow-2xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#FF5C00] w-6 h-6" />
                    <input
                      type="text"
                      placeholder="Search for dishes, restaurants..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full h-14 bg-[#fffaf5] rounded-[24px] pl-16 pr-8 text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all shadow-inner"
                    />
                  </div>
                  <button className="h-14 px-10 bg-[#0f172a] hover:bg-black text-white font-black uppercase tracking-widest rounded-[24px] shadow-xl transition-all active:scale-95 whitespace-nowrap">
                    Find Food
                  </button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Category Navigation - Better Alignment */}
        <div className="sticky top-20 z-40 bg-[#fff9f5]/80 backdrop-blur-xl border-b border-orange-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-8 overflow-x-auto no-scrollbar scroll-smooth">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-full whitespace-nowrap transition-all duration-300 font-black uppercase tracking-widest text-[11px] border-2 ${selectedCategory === cat.id
                      ? "bg-[#FF5C00] border-[#FF5C00] text-white shadow-2xl shadow-orange-200 scale-105"
                      : "bg-white border-transparent text-gray-400 hover:border-orange-200 hover:text-[#FF5C00] shadow-sm"
                    }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${selectedCategory === cat.id ? "bg-white/20" : "bg-orange-50"}`}>
                    {cat.icon}
                  </span>
                  <span>{cat.name}</span>
                </button>
              ))}

              {isAdmin && (
                <button
                  onClick={handleAddNewItem}
                  className="ml-auto flex items-center gap-3 px-8 py-3.5 bg-[#0f172a] text-white rounded-full shadow-xl hover:bg-black transition-all font-black uppercase tracking-widest text-[11px]"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Add New Item</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <section className="bg-[#fff9f5] min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col gap-12">
              {/* Dine-In Mode Banner */}
              {useAppSelector(state => state.cart.orderType) === 'dine-in' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                      <UtensilsCrossed className="text-amber-600 w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Dine-In Mode Active</h3>
                      <p className="text-sm text-gray-500 font-medium italic">Table reservation details will be requested at checkout.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-amber-200 text-amber-600 hover:bg-amber-100 font-bold rounded-xl"
                    onClick={() => dispatch(setOrderType('delivery'))}
                  >
                    Switch to Delivery
                  </Button>
                </motion.div>
              )}

              {/* Main Menu Area */}
              <div className="flex-1">
                <RestaurantMenu
                  filters={filters}
                  onEdit={isAdmin ? handleEditItem : undefined}
                />

                {/* ✅ Skeleton loader while loading more */}
                {isLoadingMore && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {[1, 2, 3].map((i) => (
                      <SkeletonCard key={`skeleton-${i}`} />
                    ))}
                  </div>
                )}

                {/* ✅ Invisible infinite scroll trigger */}
                <div ref={observerRef} className="h-4" />

                {/* ✅ End of list message */}
                {!hasMore && menuItems.length > 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">
                    ✨ You've seen all items
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Admin Modals */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => dispatch(fetchAllMenuItems({ page: 1, limit: 12, reset: true }))}
        editingItem={editingItem}
        restaurantId=""
      />
    </div>
  )
}

// ✅ Skeleton Card — prevents layout jump while loading
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
    <div className="bg-gray-200 h-48 w-full" />
    <div className="p-6 space-y-3">
      <div className="flex justify-between">
        <div className="bg-gray-200 h-5 w-3/4 rounded" />
        <div className="bg-gray-200 h-5 w-16 rounded" />
      </div>
      <div className="bg-gray-200 h-4 w-full rounded" />
      <div className="bg-gray-200 h-4 w-2/3 rounded" />
      <div className="flex justify-between items-center pt-2">
        <div className="bg-gray-200 h-6 w-20 rounded" />
        <div className="bg-gray-200 h-10 w-28 rounded-lg" />
      </div>
    </div>
  </div>
)
