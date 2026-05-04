import { useEffect, lazy, Suspense } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "./store/store"
import { logout, rehydrateAuth } from "./store/slices/authSlice"
import { ThemeProvider } from "./components/theme-provider"
import { CartProvider } from "./lib/cart-context"
import { Toaster } from "@/components/ui/sonner"
import ProtectedRoute from "./components/ProtectedRoute"
import PageLoader from "./components/PageLoader"

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
function App() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  // ✅ 1. Handle tab-specific auth consistency
  useEffect(() => {
    // Initial check for consistency
    const checkAuth = () => {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || sessionStorage.getItem("riderToken")
      if (!token && isAuthenticated) {
        dispatch(logout())
      }
    }
    checkAuth()
  }, [dispatch, isAuthenticated])

  // ✅ Handle internal path changes separately to avoid complex dependency trees
  useEffect(() => {
    dispatch(rehydrateAuth())
  }, [location.pathname, dispatch])

  // ✅ Strict Role-Based Redirection (Force Admins/Riders to their dashboards)
  useEffect(() => {
    const path = location.pathname;
    // Routes that should NOT be accessible by Admins or Riders in a "Customer" context
    const isCustomerOnlyRoute = path === '/' || path === '/menu' || path.startsWith('/restaurant/') || path === '/about' || path === '/contact' || path === '/checkout';
    
    if (isAuthenticated && user) {
      if ((user.role === 'admin' || user.role === 'superadmin') && isCustomerOnlyRoute) {
        console.log("🛡️ Redirecting Admin to Dashboard");
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'rider' && isCustomerOnlyRoute) {
        console.log("🛡️ Redirecting Rider to Dashboard");
        navigate('/rider/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname])



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