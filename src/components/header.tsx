import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, Menu as MenuIcon, LogIn, UserPlus, LogOut, User, UtensilsCrossed, History, Home } from "lucide-react"
import { CartSidebar } from "@/components/cart-sidebar"
import { AuthModal } from "@/components/auth-modal"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/store/slices/authSlice"
import { getProfile } from "@/store/thunks/authThunks"
import { useLocation } from "react-router-dom"
import socketService from "@/services/socket"
import { toast } from "sonner"

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot-password">("signin")

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const adminToken = localStorage.getItem("adminToken")
  const riderToken = localStorage.getItem("riderToken")

  const { isAuthenticated, user, isLoading } = useSelector((state: any) => state.auth)

  const openSignIn = () => {
    setAuthMode("signin")
    setAuthModalOpen(true)
  }

  const openSignUp = () => {
    setAuthMode("signup")
    setAuthModalOpen(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("riderToken")
    dispatch(logout())
    navigate("/")
  }

  useEffect(() => {
    // Always fetch profile on mount if authenticated to keep data (like loyalty points) in sync
    if (isAuthenticated && !isLoading) {
      dispatch(getProfile() as any)
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    // Automatically open auth modal if requested via location state (e.g. from a redirect)
    if ((location.state as any)?.openAuth && !isAuthenticated) {
      setAuthMode("signin")
      setAuthModalOpen(true)

      // Clear the state so it doesn't reopen on every render/refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, isAuthenticated])

  // Real-time Loyalty Points Update
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const socket = socketService.connect()
    if (socket) {
      socket.on("orderStatusUpdated", (order: any) => {
        const customerId = order.customer?._id || order.customer
        if (customerId === user.id && order.status === "delivered") {
          console.log("🏆 Order delivered! Updating loyalty points...")
          dispatch(getProfile() as any)
          toast.success("Reward Earned!", {
            description: "New loyalty points have been added to your profile!"
          })
        }
      })
    }

    return () => {
      socket?.off("orderStatusUpdated")
    }
  }, [dispatch, isAuthenticated, user?.id])

  const handleOrderHistory = () => {
    if (isAuthenticated) {
      navigate("/order-history")
    } else {
      openSignIn()
    }
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              DineFlow
            </span>
          </Link>

          {/* Search Bar (Hide for Riders) */}
          {user?.role !== 'rider' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search for restaurants, cuisines, or dishes..."
                  className="pl-10 bg-input/50 border-border rounded-full focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 text-foreground hover:text-amber-600 transition-all font-medium group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Home</span>
            </Link>

            {/* Customer Links (Hide for Riders and Admins) */}
            {user?.role !== 'rider' && user?.role !== 'admin' && user?.role !== 'superadmin' && (
              <>
                <Link
                  to="/menu"
                  className="flex items-center space-x-2 text-foreground hover:text-amber-600 transition-all font-medium group"
                >
                  <UtensilsCrossed className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                  <span>Menu</span>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOrderHistory}
                  className="flex items-center space-x-2 text-foreground hover:text-amber-600 hover:bg-amber-50 transition-all font-medium"
                >
                  <History className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Orders</span>
                </Button>

                <CartSidebar />
              </>
            )}

            {/* Auth Buttons */}
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-24 h-8 rounded-md bg-gray-200 animate-pulse"></div>
              </div>
            ) : (isAuthenticated && user?.role === 'customer') ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 leading-none mb-1">
                      {user?.name || 'User'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">
                      <span className="text-amber-500 text-[10px]">⭐</span>
                      <span className="text-xs text-amber-700 font-black whitespace-nowrap">
                        {user?.loyaltyPoints || 0} Pts
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-amber-50 border border-amber-200">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (adminToken || (isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'))) ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 border-r pr-3">{user?.name || "System Admin"}</span>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")} className="border-amber-500 text-amber-600 hover:bg-amber-50">
                  Admin Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-amber-50 border border-amber-200">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (riderToken || (isAuthenticated && user?.role === 'rider')) ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 pr-3">{user?.name || "Courier Partner"}</span>
                <Button variant="outline" size="sm" onClick={() => navigate("/rider/dashboard")} className="border-orange-500 text-orange-600 hover:bg-orange-50">
                  Rider Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-orange-50 border border-orange-200">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={openSignIn} className="hover:bg-amber-50">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {user?.role !== 'rider' && user?.role !== 'admin' && user?.role !== 'superadmin' && <CartSidebar />}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-amber-50">
                  <MenuIcon className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-sm">
                <div className="flex flex-col space-y-8 mt-8">
                  <nav className="flex flex-col space-y-6">
                    <Link
                      to="/"
                      className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50"
                    >
                      <Home className="w-5 h-5 mr-2 text-amber-600" />
                      Home
                    </Link>
                    {user?.role !== 'rider' && user?.role !== 'admin' && user?.role !== 'superadmin' && (
                      <>
                        <Link
                          to="/menu"
                          className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50"
                        >
                          <UtensilsCrossed className="w-5 h-5 mr-2 text-amber-600" />
                          Menu
                        </Link>
                        <button
                          onClick={handleOrderHistory}
                          className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50 text-left"
                        >
                          <History className="w-5 h-5 mr-2 text-amber-600" />
                          My Orders
                        </button>
                      </>
                    )}
                  </nav>

                  {isLoading ? (
                    <div className="flex flex-col space-y-4 pt-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ) : (isAuthenticated && user?.role === 'customer') ? (
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name || "User"}</p>
                          <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full w-fit mt-1">
                            <span className="text-amber-600 text-[10px]">⭐</span>
                            <span className="text-xs text-amber-700 font-black">{user?.loyaltyPoints || 0} Pts</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleLogout} className="justify-start border-amber-200">
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                      </Button>
                    </div>
                  ) : (adminToken || (isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'))) ? (
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name || "System Admin"}</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/admin/dashboard")} className="justify-start border-amber-200 text-amber-600">
                        Admin Dashboard
                      </Button>
                      <Button variant="outline" onClick={handleLogout} className="justify-start border-amber-200">
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                      </Button>
                    </div>
                  ) : (riderToken || (isAuthenticated && user?.role === 'rider')) ? (
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name || "Courier Partner"}</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/rider/dashboard")} className="justify-start border-blue-200 text-blue-600">
                        Rider Dashboard
                      </Button>
                      <Button variant="outline" onClick={handleLogout} className="justify-start border-blue-200">
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3 pt-4">
                      <Button variant="outline" onClick={openSignIn} className="justify-start border-amber-200">
                        <LogIn className="w-5 h-5 mr-3" />
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </header>
  )
}