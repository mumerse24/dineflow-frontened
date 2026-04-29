import { useEffect, lazy, Suspense } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "./store/store"
import { logout } from "./store/slices/authSlice"
import { ThemeProvider } from "./components/theme-provider"
import { CartProvider } from "./lib/cart-context"
import { Toaster } from "@/components/ui/sonner"

// Lazy-load all pages — only downloads the code when the user navigates to that page
const HomePage = lazy(() => import("./pages/HomePage"))
const LandingPage = lazy(() => import("./pages/LandingPage"))
const MenuPage = lazy(() => import("./pages/MenuPage"))
const AboutPage = lazy(() => import("./pages/AboutPage"))
const ContactPage = lazy(() => import("./pages/ContactPage"))
const RestaurantPage = lazy(() => import("./pages/RestaurantPage"))
const RegisterRestaurantPage = lazy(() => import("./pages/RegisterRestaurantPage"))
const CheckoutPage = lazy(() => import("./pages/Checkout"))
const SuccessPage = lazy(() => import("./pages/SuccessPage"))
const OrderHistoryPage = lazy(() => import("./pages/OrderHistory"))
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"))
const Chatbot = lazy(() => import("./components/Chatbot"))
const RateOrderPage = lazy(() => import("./pages/RateOrderPage"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const GroupOrderPage = lazy(() => import("./pages/GroupOrderPage"))

// Heavy admin/rider pages — loaded only when needed
const AdminPage = lazy(() => import("./pages/AdminPage"))
const RiderDashboard = lazy(() => import("./pages/rider-dashboard"))

const OrderSuccessPage = lazy(() => import("./pages/OrderSuccess"))

// Loading spinner shown while lazy chunks download
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      <span className="text-sm text-gray-400 font-medium">Loading...</span>
    </div>
  </div>
)

// Protected Route Component
interface ProtectedRouteProps {
  children: JSX.Element
  allowedRoles?: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  if (isLoading && !isAuthenticated) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role || "")) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("riderToken")
      if (!token && isAuthenticated) {
        dispatch(logout())
      }
    }
    checkAuth()
  }, [dispatch, isAuthenticated])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <CartProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Root Route: Shows Landing Page for guests, Dashboard for users */}
              <Route 
                path="/" 
                element={
                  isAuthenticated ? <HomePage /> : <LandingPage />
                } 
              />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/restaurant/:id" element={<RestaurantPage />} />
              <Route path="/register-restaurant" element={<RegisterRestaurantPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/order-confirmation" element={<SuccessPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/order-history" element={<OrderHistoryPage />} />
              <Route path="/order/track/:id" element={<OrderTrackingPage />} />
              <Route path="/rate-order/:id" element={<RateOrderPage />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/group-order/:inviteCode" element={<GroupOrderPage />} />

              {/* Legacy Redirects */}
              <Route 
                path="/admin/login" 
                element={
                  isAuthenticated && (user?.role === "admin" || user?.role === "superadmin") 
                    ? <Navigate to="/admin/dashboard" replace /> 
                    : <Navigate to="/" state={{ openAuth: true, defaultRole: "admin" }} replace />
                } 
              />
              <Route 
                path="/rider/login" 
                element={
                  isAuthenticated && user?.role === "rider" 
                    ? <Navigate to="/rider/dashboard" replace /> 
                    : <Navigate to="/" state={{ openAuth: true, defaultRole: "rider" }} replace />
                } 
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              <Route
                path="/rider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["rider"]}>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/rider" element={<Navigate to="/rider/dashboard" replace />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Suspense fallback={null}>
            <Chatbot />
          </Suspense>
          <Toaster position="top-center" />
        </div>
      </CartProvider>
    </ThemeProvider>
  )
}

export default App