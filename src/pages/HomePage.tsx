import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RecommendedDishes } from "@/components/recommended-dishes"
import { DealsCarousel } from "@/components/deals-carousel"
import { Search, MapPin, Clock, ArrowRight, Star, ChevronRight, Pizza, Utensils, Coffee } from "lucide-react"
import { RootState, AppDispatch } from "@/store/store"
import { fetchOrders } from "@/store/slices/orderSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"
import { addToCartServer, setOrderType } from "@/store/slices/cartSlice"
import { fetchRestaurants } from "@/store/slices/restaurantSlice"
import { toast } from "sonner"

const DEFAULT_CATEGORIES = [
  { name: "Pizza", icon: Pizza, color: "bg-orange-100 text-orange-600" },
  { name: "Biryani", icon: Utensils, color: "bg-amber-100 text-amber-600" },
  { name: "Burgers", icon: Utensils, color: "bg-red-100 text-red-600" },
  { name: "Coffee", icon: Coffee, color: "bg-brown-100 text-brown-600" },
  { name: "Fast Food", icon: Utensils, color: "bg-yellow-100 text-yellow-600" },
  { name: "Healthy", icon: Utensils, color: "bg-green-100 text-green-600" },
]

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const { orders } = useSelector((state: RootState) => state.orders)
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<any[]>([])

  // Role-based redirection is now handled via explicit navigation in the Header or by protected routes.
  // This allows users to stay on the page they are currently viewing after a refresh.


  const { restaurants } = useSelector((state: RootState) => state.restaurants)
  const [primaryRestaurantId, setPrimaryRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchOrders({ limit: 5 }))
    dispatch(fetchRestaurants({ limit: 1 })) // Fetch only the first restaurant
    
    // Fetch dynamic categories
    const fetchCategories = async () => {
      try {
        const response = await api.get("/menu/categories/list")
        if (response.data.success) {
          const categoryNames = response.data.data
          const dynamicCats = categoryNames.map((name: string) => {
            const defaultMatch = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase())
            return {
              name,
              icon: defaultMatch?.icon || Utensils,
              color: defaultMatch?.color || "bg-amber-100 text-amber-600"
            }
          })
          setCategories(dynamicCats.length > 0 ? dynamicCats : DEFAULT_CATEGORIES)
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        setCategories(DEFAULT_CATEGORIES)
      }
    }
    fetchCategories()
  }, [dispatch])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`)
    } else {
      navigate('/menu')
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/menu?category=${encodeURIComponent(categoryName)}`)
  }

  const handleViewAllDeals = () => {
    navigate('/menu')
  }

  const handleReorder = async (order: any) => {
    if (!order.items || order.items.length === 0) return

    try {
      const firstItem = order.items[0]
      const menuItemId = typeof firstItem.menuItem === 'object' ? firstItem.menuItem._id : firstItem.menuItem
      const restaurantId = typeof order.restaurant === 'object' ? order.restaurant._id : order.restaurant

      await dispatch(addToCartServer({
        menuItemId,
        quantity: 1,
        restaurantId
      })).unwrap()
      
      toast.success(`${firstItem.name} added to cart!`)
      navigate('/checkout')
    } catch (error: any) {
      toast.error(error || "Failed to reorder item")
    }
  }

  const activeOrders = (orders || []).filter(
    (order) => !["delivered", "cancelled"].includes(order.status)
  )

  const recentOrders = (orders || []).filter(
    (order) => order.status === "delivered"
  ).slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* 👋 Welcome & Search Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-white">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-black tracking-tight"
              >
                Welcome back, {user?.name?.split(" ")[0] || "Foodie"}!
              </motion.h1>
              <p className="text-amber-50 text-lg sm:text-xl font-medium opacity-90">
                What's on your mind today? We've got the best deals ready for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={20} />
                  <Input 
                    placeholder="Search for dishes, restaurants..." 
                    className="pl-12 h-14 bg-white/95 border-none rounded-2xl text-gray-900 shadow-lg focus:ring-4 focus:ring-amber-500/20 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  className="h-14 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-lg shadow-xl hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                >
                  Find Food
                </button>
                <button 
                  onClick={() => {
                    const primaryId = "697234df784aef4faaeec4a9"; // Enforced Single Restaurant ID
                    dispatch(setOrderType('dine-in'));
                    navigate('/checkout', { state: { restaurantId: primaryId, orderType: 'dine-in' } });
                    toast.success("Dine-In Reservation flow activated!");
                  }}
                  className="h-14 px-8 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg border border-white/30 backdrop-blur-sm shadow-xl hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                >
                  <Utensils size={20} />
                  Dine-In
                </button>
              </div>
            </div>

          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl"></div>
        </section>

        {/* 🚚 Active Order Tracker (Customer Only) */}
        {!isAdmin && activeOrders.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-amber-600" /> Active Orders
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <motion.div 
                  key={order._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/order/track/${order._id}`)}
                  className="cursor-pointer bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Clock className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Order #{order._id.slice(-6)}</p>
                    <h3 className="font-bold text-gray-900 truncate">
                      {order.items[0]?.name || "Multiple Items"}
                    </h3>
                    <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize">
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <ChevronRight className="text-gray-300" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 🍕 Category Quick Filters */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <motion.button
                key={cat.name}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(cat.name)}
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 transition-colors w-full"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <cat.icon size={24} />
                </div>
                <span className="text-sm font-bold text-gray-700 truncate w-full text-center">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 🔥 Today's Deals */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Top Offers for You</h2>
            <Button 
              variant="ghost" 
              className="text-amber-600 font-bold hover:bg-amber-50"
              onClick={handleViewAllDeals}
            >
              View All <ArrowRight className="ml-2" size={18} />
            </Button>
          </div>
          <DealsCarousel />
        </section>

        {/* ✨ Recommended for You (Customer Only) */}
        {!isAdmin && <RecommendedDishes />}

        {/* 🕒 Reorder Quickly (Customer Only) */}
        {!isAdmin && recentOrders.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Reorder Quickly</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentOrders.map((order) => (
                <Card key={order._id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group rounded-2xl">
                  <CardContent className="p-0">
                    <div className="p-5 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {typeof order.items[0]?.menuItem === 'object' && order.items[0]?.menuItem?.image ? (
                          <img src={order.items[0].menuItem.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600 font-bold">
                            {order.items[0]?.name?.[0] || "F"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {order.items[0]?.name || "Previous Order"}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Star className="text-amber-500 fill-amber-500" size={14} />
                          <span className="font-medium">4.8</span>
                          <span>•</span>
                          <span>{typeof order.restaurant === 'object' ? order.restaurant.name : "Restaurant"}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-3 w-full border border-gray-200 text-gray-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 rounded-lg h-9 font-bold transition-all"
                          onClick={() => handleReorder(order)}
                        >
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  )
}
