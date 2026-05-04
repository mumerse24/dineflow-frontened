import axios from "axios"
import { toast } from "sonner"

const getDynamicApiUrl = () => {
  const localFallback = "http://localhost:5000/api";
  
  if (typeof window === 'undefined') return import.meta.env.VITE_API_URL || localFallback;

  // Check for any legacy overrides and clear them
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('VITE_API_URL_OVERRIDE');
  }

  const envUrl = import.meta.env.VITE_API_URL;
  
  // If the environment variable or any other source still has ngrok, FORCE local fallback
  if (envUrl && envUrl.includes('ngrok')) {
    console.warn("⚠️ Ngrok URL detected in environment, forcing local fallback:", localFallback);
    return localFallback;
  }

  return envUrl || localFallback;
};

const API_BASE_URL = getDynamicApiUrl();
console.log("🔧 API Base URL →", API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// ✅ ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      if (config.data) {
        console.log("📦 Request Data:", JSON.stringify(config.data, null, 2))
      }
    }

    // Get token based on application context
    let token = null;
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        token = sessionStorage.getItem("adminToken");
      } else if (window.location.pathname.startsWith('/rider')) {
        token = sessionStorage.getItem("riderToken");
      } else {
        token = sessionStorage.getItem("token");
      }
    }

    // Fallback logic removed to prevent session bleeding across paths
    if (!token) {
      // Return config without token to treat as guest on this path
      return config;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Authorization token attached: ${token.substring(0, 20)}...`)
      }
    } else {
      // 💡 ONLY warn if it's NOT a login or signup request
      const isPublicRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/register') || config.url?.includes('/riders/login');
      if (!isPublicRoute && process.env.NODE_ENV === 'development') {
        console.warn("⚠️ No authentication token found in sessionStorage")
      }
    }

    return config
  },
  (error) => {
    console.error("❌ Request interceptor error:", error)
    return Promise.reject(error)
  }
)

// ✅ ENHANCED RESPONSE INTERCEPTOR with Menu-Specific Handling
api.interceptors.response.use(
  (response) => {
    // Debug logging for successful responses
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Success: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Don't log for cancelled requests
    if (axios.isCancel(error)) {
      console.log("Request cancelled:", error.message)
      return Promise.reject(error)
    }

    if (error.response?.status === 429) {
      toast.error("Too many requests! Please wait a moment...", {
        id: "rate-limit-error", // Prevent toast spam
      })
      return Promise.reject(error)
    }

    const { response } = error
    const originalRequest = error.config

    // ============ MENU-SPECIFIC ERROR HANDLING ============
    if (originalRequest?.url === '/menu' && originalRequest?.method === 'post') {
      console.error("❌ MENU ADD ERROR - Detailed Analysis:")

      // Check if user is authenticated
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("adminToken")
      if (!token) {
        console.error("❌ No authentication token found")
        toast.error("You must be logged in as admin to add menu items")

        // Redirect to admin login
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
        return Promise.reject(error)
      }

      // Check token format
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          console.error("❌ Invalid token format")
        }
      } catch (e) {
        console.error("❌ Token parse error:", e)
      }

      // Log the data that was sent
      if (originalRequest.data) {
        console.log("📦 Data sent:", JSON.parse(originalRequest.data))
      }
    }

    // Debug logging for errors
    console.error("❌ API Error:", {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: response?.status,
      message: error.message,
      data: response?.data
    })

    // Show validation errors for 400 responses
    if (response?.status === 400 && response?.data?.errors) {
      console.table(response.data.errors)

      // Create a user-friendly message
      const errorMessages = response.data.errors.map((e: any) => {
        if (e.param === 'images') return "At least one image is required"
        if (e.param === 'name') return "Name must be between 2 and 100 characters"
        if (e.param === 'description') return "Description must be between 10 and 300 characters"
        if (e.param === 'price') return "Price must be a positive number"
        if (e.param === 'category') return "Category is required"
        if (e.param === 'restaurant') return "Valid restaurant ID is required"
        return e.msg || e.message
      }).join("\n")

      toast.error(`Validation Error:\n${errorMessages}`)
    }

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      console.warn("🔒 Unauthorized access detected")

      // Show user-friendly message
      if (!originalRequest._retry) {
        originalRequest._retry = true

        // Don't intercept 401 for login endpoints (let the login forms handle their own errors)
        if (originalRequest.url?.includes('/auth/login')) {
          return Promise.reject(error);
        }

        // Don't logout if FCM token registration fails (not critical)
        if (originalRequest.url?.includes('/auth/fcm-token')) {
          console.warn("FCM token registration failed, but proceeding without logout.");
          return Promise.reject(error);
        }

        // Clear all authentication data thoroughly
        sessionStorage.removeItem("token")
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("adminToken")
        sessionStorage.removeItem("adminUser")
        sessionStorage.removeItem("adminData")
        sessionStorage.removeItem("riderToken")
        sessionStorage.removeItem("loginTime")

        // Remove auth header from axios defaults
        delete api.defaults.headers.common.Authorization

        const isAdminPage = window.location.pathname.includes('/admin')
        const isRiderPage = window.location.pathname.includes('/rider')

        const message = isAdminPage
          ? "Admin session expired. Please login again."
          : isRiderPage
            ? "Rider session expired. Please login again."
            : "Your session has expired. Please login again."

        // Use custom alert or just redirect
        console.error(message)

        // Redirect after a small delay to allow state changes if any
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      }
    }

    // Handle 403 Forbidden
    if (response?.status === 403) {
      console.warn("🚫 Forbidden access detected")

      if (typeof window !== 'undefined') {
        const message = response.data?.message || "You don't have permission to perform this action."
        toast.warning(message)
      }
    }

    // Handle 404 Not Found
    if (response?.status === 404) {
      console.warn("🔍 Endpoint not found:", originalRequest?.url)
    }

    // Handle 500 Server Error
    if (response?.status >= 500) {
      console.error("💥 Server error:", response.status)
      toast.error("Server error. Please try again later.")
    }

    // Handle Network Errors
    if (!response && error.message === "Network Error") {
      console.error("🌐 Network error - Check your internet connection")
      toast.error("Cannot connect to server. Please check your internet connection.")
    }

    // Handle Timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error("⏰ Request timeout")
      toast.error("Request timed out. Please try again.")
    }

    // Always return a consistent error format
    return Promise.reject({
      status: response?.status || 0,
      message: error.message || "Unknown error occurred",
      data: response?.data || null,
      config: originalRequest
    })
  }
)

// ✅ Helper function to set token manually
export const setAuthToken = (token: string) => {
  sessionStorage.setItem("token", token)
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  console.log("🔧 Authentication token set")
}

// ✅ Helper function to set admin token specifically
export const setAdminToken = (token: string) => {
  sessionStorage.setItem("adminToken", token)
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  console.log("🔧 Admin authentication token set")
}

// ✅ Helper function to clear all auth data
export const clearAuth = () => {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("user")
  sessionStorage.removeItem("adminToken")
  sessionStorage.removeItem("adminUser")
  delete api.defaults.headers.common.Authorization
  console.log("🔧 Authentication cleared")
}

// ✅ Helper to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/admin')) {
      return !!sessionStorage.getItem("adminToken");
    } else if (window.location.pathname.startsWith('/rider')) {
      return !!sessionStorage.getItem("riderToken");
    }
  }
  const token = sessionStorage.getItem("token") || sessionStorage.getItem("adminToken");
  return !!token
}

// ✅ Helper to check if admin is authenticated
export const isAdminAuthenticated = () => {
  const token = sessionStorage.getItem("adminToken")
  return !!token
}

// ✅ Helper to get current token
export const getCurrentToken = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/admin')) {
      return sessionStorage.getItem("adminToken");
    } else if (window.location.pathname.startsWith('/rider')) {
      return sessionStorage.getItem("riderToken");
    }
  }
  return sessionStorage.getItem("token") || sessionStorage.getItem("adminToken");
}

// ✅ Helper to get admin token
export const getAdminToken = () => {
  return sessionStorage.getItem("adminToken")
}

// ✅ Helper to validate token format
export const validateToken = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Check if it's a valid JWT format
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    return header && payload
  } catch (e) {
    return false
  }
}

// ✅ Cancel token utility for cancelling requests
export const createCancelToken = () => {
  return axios.CancelToken.source()
}

export default api