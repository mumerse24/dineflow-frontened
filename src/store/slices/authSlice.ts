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
  error: string | null
  isAuthenticated: boolean
}

// Check local storage for normal user, admin, or rider data
const storedUser = localStorage.getItem("user") || localStorage.getItem("adminData") || localStorage.getItem("riderData");
const storedToken = localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("riderToken");

let initialUser = null;
if (storedUser && storedUser !== "null" && storedUser !== "undefined") {
  try {
    initialUser = JSON.parse(storedUser);
  } catch (e) {
    console.error("Error parsing storedUser:", e);
    localStorage.removeItem("user");
  }
}

const initialState: AuthState = {
  user: initialUser,
  token: storedToken,
  isLoading: false,
  error: null,
  isAuthenticated: !!storedToken,
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
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminData")
      localStorage.removeItem("riderToken")
      localStorage.removeItem("loginTime")
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload))
      } else {
        localStorage.removeItem("user")
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
        localStorage.setItem("user", JSON.stringify(action.payload.user))
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("riderToken", action.payload.token)
        localStorage.setItem("riderData", JSON.stringify(action.payload.user))
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
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("riderToken")
        localStorage.removeItem("riderData")
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer   