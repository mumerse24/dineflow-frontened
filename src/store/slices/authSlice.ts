import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "../../types"
import { 
  loginUser, 
  registerUser, 
  loginAdmin, 
  riderLogin, 
  updateProfile, 
  changePassword, 
  getProfile 
} from "../thunks/authThunks"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  profileFetched: boolean // ✅ Prevents redundant getProfile calls
  error: string | null
  isAuthenticated: boolean
}

const getInitialAuthState = (path: string = window.location.pathname) => {
  let storedUser = null;
  let storedToken = null;

  // 1. Try to get role-specific data based on path
  if (path.startsWith('/admin')) {
    storedUser = sessionStorage.getItem("adminData");
    storedToken = sessionStorage.getItem("adminToken");
  } else if (path.startsWith('/rider')) {
    storedUser = sessionStorage.getItem("riderData");
    storedToken = sessionStorage.getItem("riderToken");
  } else {
    storedUser = sessionStorage.getItem("user");
    storedToken = sessionStorage.getItem("token");
  }

  // 2. Fallback: If no data found for current path, try ANY available session
  // This is crucial for the global redirection guard to work!
  if (!storedToken || storedToken === "null" || storedToken === "undefined") {
    storedToken = sessionStorage.getItem("adminToken") || sessionStorage.getItem("riderToken") || sessionStorage.getItem("token");
    
    if (storedToken === sessionStorage.getItem("adminToken")) {
      storedUser = sessionStorage.getItem("adminData");
    } else if (storedToken === sessionStorage.getItem("riderToken")) {
      storedUser = sessionStorage.getItem("riderData");
    } else {
      storedUser = sessionStorage.getItem("user");
    }
  }

  let user = null;
  if (storedUser && storedUser !== "null" && storedUser !== "undefined") {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing storedUser:", e);
    }
  }

  // Sanity Check: If we have a token but NO user data, it's a corrupted session.
  // We should treat it as unauthenticated to avoid "undefined" errors in the UI.
  if (storedToken && !user) {
    return { user: null, token: null, isAuthenticated: false };
  }

  return {
    user,
    token: storedToken,
    isAuthenticated: !!storedToken && storedToken !== "null" && storedToken !== "undefined"
  };
}

const initialState: AuthState = {
  ...getInitialAuthState(),
  isLoading: false,
  profileFetched: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      sessionStorage.removeItem("token")
      sessionStorage.removeItem("user")
      sessionStorage.removeItem("adminToken")
      sessionStorage.removeItem("adminData")
      sessionStorage.removeItem("riderToken")
      sessionStorage.removeItem("loginTime")
      sessionStorage.removeItem("riderData")
    },
    clearError: (state) => {
      state.error = null
    },
    rehydrateAuth: (state) => {
      const newState = getInitialAuthState();
      
      // Strict equality check to prevent unnecessary state updates
      const tokenChanged = state.token !== newState.token;
      const authChanged = state.isAuthenticated !== newState.isAuthenticated;
      const userChanged = state.user?._id !== newState.user?._id;

      if (tokenChanged || authChanged || userChanged) {
        state.user = newState.user;
        state.token = newState.token;
        state.isAuthenticated = newState.isAuthenticated;
        // If the user changed or we logged out, reset profileFetched
        if (userChanged || !newState.isAuthenticated) {
          state.profileFetched = false;
        }
      }
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      if (action.payload) {
        // Save to role-specific key
        if (action.payload.role === "admin" || action.payload.role === "superadmin") {
          sessionStorage.setItem("adminData", JSON.stringify(action.payload))
        } else if (action.payload.role === "rider") {
          sessionStorage.setItem("riderData", JSON.stringify(action.payload))
        } else {
          sessionStorage.setItem("user", JSON.stringify(action.payload))
        }
      } else {
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("adminData")
        sessionStorage.removeItem("riderData")
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.profileFetched = true // ✅ Mark as fetched
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false
      })
      // Admin Login (from authSlice)
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null // ✅ Ensure error is cleared
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Rider Login (Break circular dependency using string matching)
      .addCase("rider/login/pending", (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase("rider/login/fulfilled", (state, action: any) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        sessionStorage.setItem("riderToken", action.payload.token)
        sessionStorage.setItem("riderData", JSON.stringify(action.payload.user))
      })
      .addCase("rider/login/rejected", (state, action: any) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Clear all auth state when Rider logs out
      .addCase("rider/riderLogout", (state) => {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("token")
        sessionStorage.removeItem("riderToken")
        sessionStorage.removeItem("riderData")
      })
  },
})

export const { logout, clearError, setUser, rehydrateAuth } = authSlice.actions
export default authSlice.reducer   