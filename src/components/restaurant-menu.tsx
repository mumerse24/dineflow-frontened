"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { MenuItem, Filters } from "@/types"
import { addToCartServer } from "@/store/slices/cartSlice"
import { deleteMenuItem } from "@/store/slices/menuSlice"
import { Edit, Trash2, Image as ImageIcon, Plus } from "lucide-react"
import { DishDetailModal } from "./dish-detail-modal"
import { toast } from "sonner"

// Helper component for smooth image loading with a skeleton pulse
const ImageWithSkeleton = ({ src, alt }: { src: string, alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="w-full h-full relative bg-gray-100 overflow-hidden">
      {/* Skeleton Background while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-0">
          <ImageIcon className="w-8 h-8 text-gray-400 opacity-30" />
        </div>
      )}
      {/* Hidden initially, fades in once downloaded */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 z-10 ${isLoaded ? 'opacity-100' : 'opacity-0 scale-95'}`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          setIsLoaded(true) // stop animation
          const target = e.target as HTMLImageElement
          const fallback = "https://placehold.co/800x600/f3f4f6/a1a1aa?text=No+Image"
          if (target.src !== fallback) {
            target.src = fallback
          }
        }}
      />
    </div>
  )
}

interface RestaurantMenuProps {
  filters: Filters
  onEdit?: (item: MenuItem) => void // Add an optional prop to handle editing if needed
}

export default function RestaurantMenu({ filters, onEdit }: RestaurantMenuProps) {
  const { items: menuItems, isLoading } = useAppSelector((state) => state.menu)
  const cartState = useAppSelector((state) => state.cart)
  const user = useAppSelector((state) => state.auth.user) // Get current user
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  console.log("RestaurantMenu user check:", user);


  // Separate items into Deals and Regular Items
  // ✅ Improved logic: Deals section always gets its items, but regular menu now includes deals if a category filter is active
  const deals = menuItems.filter(item =>
    item.isDeal || 
    item.category === "Special Deals"
  )
  
  const regularItems = menuItems.filter(item => {
    // ✅ Admin should always see everything in the main list for easy management
    if (isAdmin) return true;
    
    // If we are filtering by category (and it's not "Special Deals"), include deals that match that category
    if (filters.categories.length > 0 && !filters.categories.includes("Special Deals")) {
        return true; 
    }
    // Otherwise keep them separate for customers to avoid duplicates on the main page
    return !item.isDeal && item.category !== "Special Deals";
  })

  // Filter regular items based on search and category
  const filteredRegularItems = regularItems.filter((item) => {
    // ✅ Special Case: Popular Section
    if (filters.categories.includes("Popular")) {
        return item.isPopular || (item.orderCount && item.orderCount > 0) || (item.rating && item.rating.average >= 4.5);
    }

    // Category Filter
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }
    // Search Filter
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
    }
    return true
  })

  // ✅ Sort items if Popular is selected to show most ordered first
  const finalItems = filters.categories.includes("Popular")
    ? [...filteredRegularItems].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
    : filteredRegularItems;

  // Determine what to show in the deals section
  const showDeals = (filters.categories.length === 0 || filters.categories.includes("Special Deals")) && !filters.categories.includes("Popular")
  const filteredDeals = deals.filter(item => {
    // Search Filter for deals
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
    }
    return true;
  })

  const getImageUrl = (item: MenuItem) => {
    let imgPath = null;

    if (item.images && item.images.length > 0) {
      imgPath = item.images[0];
    } else if (item.image) {
      imgPath = item.image;
    }

    if (!imgPath) {
      return "https://placehold.co/800x600/f3f4f6/a1a1aa?text=No+Image";
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

  // Add to cart handler (optimized with toast + timeout safety)
  const handleAddToCart = async (item: MenuItem) => {
    // ✅ Check if user is logged in
    if (!user) {
      toast.error("Please login first to place an order", {
        description: "You need to be signed in to add items to your cart.",
        duration: 5000,
        action: {
          label: "Login Now",
          onClick: () => navigate("/", { state: { openAuth: true } })
        }
      });
      return;
    }

    const validId = item._id || (item as any).id;

    if (!validId) {
      toast.error("Something went wrong. Item ID missing.");
      return;
    }

    const restaurantId = typeof item.restaurant === "object" && item.restaurant !== null
      ? (item.restaurant as { _id: string })._id
      : item.restaurant;

    if (!restaurantId) {
      toast.error("Restaurant info missing for this item.");
      return;
    }

    if (loadingItemId === validId) return; // prevent double click

    setLoadingItemId(validId);

    // ✅ Safety timeout — force reset loading after 8 seconds
    const timeoutId = setTimeout(() => {
      setLoadingItemId((current) => {
        if (current === validId) {
          toast.error("Request timed out. Please try again.");
          return null;
        }
        return current;
      });
    }, 8000);

    try {
      await dispatch(
        addToCartServer({
          menuItemId: validId,
          quantity: 1,
          restaurantId,
        })
      ).unwrap();

      toast.success(`${item.name} added to cart!`);
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : error?.message || "Failed to add to cart";
      toast.error(msg);
    } finally {
      clearTimeout(timeoutId);
      setLoadingItemId(null); // ✅ ALWAYS reset loading
    }
  };

  // Delete item handler
  const handleDelete = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      try {
        await dispatch(deleteMenuItem(itemId)).unwrap()
      } catch (error) {
        console.error("Failed to delete item:", error)
        toast.error("Failed to delete item. Please try again.")
      }
    }
  }

  // ✅ Show skeleton grid on initial load
  if (isLoading && menuItems.length === 0) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
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
        ))}
      </div>
    )
  }

  // If no items at all
  if (filteredDeals.length === 0 && filteredRegularItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900">No items match your filters</h3>
        <p className="text-gray-500 mt-2">Try different categories</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-24">
        {/* 🔥 Special Deals Section */}
        {showDeals && filteredDeals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">🔥 Special Deals</h2>
                <span className="bg-orange-50 text-[10px] font-black text-[#FF5C00] px-4 py-1.5 rounded-full border border-orange-100 uppercase tracking-widest border-b-2 border-r-2 border-orange-200/50">
                    {filteredDeals.length} deals
                </span>
              </div>
              <button className="text-[#FF5C00] font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">
                View All →
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredDeals.map((item) => renderMenuItem(item))}
            </div>
          </div>
        )}

        {/* 🍽️ Regular Menu Items */}
        {finalItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  {filters.categories.includes("Popular") ? "⭐ Most Ordered" : "🍽️ Menu Items"}
                </h2>
                <span className="bg-orange-50 text-[10px] font-black text-[#FF5C00] px-4 py-1.5 rounded-full border border-orange-100 uppercase tracking-widest border-b-2 border-r-2 border-orange-200/50">
                  {finalItems.length} items
                </span>
              </div>
              <button className="text-[#FF5C00] font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">
                View All →
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {finalItems.map((item) => renderMenuItem(item))}
            </div>
          </div>
        )}
      </div>

      <DishDetailModal
        dish={selectedDish}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  )

  // Helper to render a menu item
  function renderMenuItem(item: MenuItem) {
    const itemId = item._id || (item as any).id;
    const isAdding = loadingItemId === itemId;
    const isADeal = item.isDeal || item.category === "Special Deals";

    // Dynamic Badges based on item properties
    const badges = [];
    if (isADeal) {
        if (item.price < 1000) badges.push("Best Value");
        else badges.push("Family Size");
    } else if (item.rating && item.rating.average > 4.5) {
        badges.push("Popular");
    } else if (item.category === "Burgers") {
        badges.push("Fan Favourite");
    }

    return (
      <motion.div
        key={itemId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -10 }}
        onClick={() => {
          setSelectedDish(item);
          setIsDetailModalOpen(true);
        }}
        className="flex flex-col h-full bg-white rounded-[48px] shadow-2xl shadow-orange-900/5 overflow-hidden border border-orange-50 hover:shadow-orange-900/10 transition-all duration-500 group cursor-pointer relative"
      >
        {/* Image Area */}
        <div className="h-64 relative bg-[#fffaf5] overflow-hidden">
          <ImageWithSkeleton src={getImageUrl(item)} alt={item.name} />
          
          {/* Top Badges */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
            {badges.map((badge, i) => (
                <div key={i} className="bg-[#FF5C00] text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 backdrop-blur-sm">
                    {badge}
                </div>
            ))}
            {isADeal && (
                 <div className="bg-white/90 backdrop-blur-md text-[#FF5C00] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-orange-100">
                    {item.isFeatured ? "Featured Deal" : item.isDeal ? "Combo Deal" : "Special Offer"}
                </div>
            )}
          </div>

          {isAdding && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF5C00] border-t-transparent shadow-2xl shadow-orange-200" />
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="absolute inset-0 bg-orange-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                className="w-12 h-12 bg-white text-[#FF5C00] rounded-2xl shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
              >
                <Edit size={20} strokeWidth={3} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); itemId && handleDelete(itemId, item.name); }}
                className="w-12 h-12 bg-red-500 text-white rounded-2xl shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
              >
                <Trash2 size={20} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col flex-1">
          <div className="mb-6">
            <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tighter leading-none mb-3 group-hover:text-[#FF5C00] transition-colors min-h-[2rem]">
              {item.name}
            </h3>
            <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed h-10 mb-6">
              {item.description}
            </p>

            {/* Pill Tags (Ingredients or features) */}
            <div className="flex flex-wrap gap-2">
              {isADeal && item.dealItems?.map((tag, i) => (
                  <span key={i} className="bg-orange-50 text-[10px] font-black text-[#FF5C00] px-4 py-1.5 rounded-full border border-orange-100 uppercase tracking-widest whitespace-nowrap">
                      {tag}
                  </span>
              ))}
              {!isADeal && (
                  <>
                      <span className="bg-orange-50 text-[10px] font-black text-[#FF5C00] px-4 py-1.5 rounded-full border border-orange-100 uppercase tracking-widest whitespace-nowrap">
                          {item.category}
                      </span>
                      {(item.dietaryTags?.includes("Veg") || item.dietaryTags?.includes("Vegetarian")) && (
                           <span className="bg-green-50 text-[10px] font-black text-green-600 px-4 py-1.5 rounded-full border border-green-100 uppercase tracking-widest whitespace-nowrap">
                              Veg
                          </span>
                      )}
                  </>
              )}
            </div>
          </div>

          {/* Footer Area - Perfectly Centered and Pinned */}
          <div className="mt-auto pt-6 border-t border-orange-100/50 flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1 block">Starting at</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#FF5C00] tracking-tighter leading-none">
                  Rs. {item.price?.toFixed(0) || "0"}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-xs text-gray-300 line-through font-bold">
                    {item.originalPrice.toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            {!isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                disabled={isAdding || cartState.isLoading}
                className={`
                  h-14 px-8 rounded-full flex items-center justify-center gap-3 transition-all duration-300 shadow-xl
                  ${isAdding
                    ? "bg-orange-100 text-[#FF5C00] scale-95"
                    : "bg-[#FF5C00] text-white hover:bg-[#E65200] shadow-orange-200 active:scale-95"
                  }
                `}
              >
                {isAdding ? (
                   <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF5C00] border-t-transparent" />
                ) : (
                  <>
                    <Plus size={20} strokeWidth={4} />
                    <span className="font-black uppercase tracking-widest text-[11px]">Add to Cart</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}