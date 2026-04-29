import { createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../services/api"
import AuthAdmin from "../../services/alogin"
import { riderService } from "../../services/riderService"
import type { User, ApiResponse } from "../../types"

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", credentials)
      const { user, token } = response.data.data
      
      if (user.role === "rider") {
        return rejectWithValue("Access denied. Please use the Rider app to login.")
      }
      if (user.role === "admin" || user.role === "superadmin") {
        return rejectWithValue("Access denied. Please use the Admin dashboard to login.")
      }

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      return { user, token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed")
    }
  },
)

// Unified registration
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      name: string
      email: string
      password: string
      phone?: string
      role?: "customer" | "restaurant"
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", userData)
      const { user, token } = response.data.data
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      return { user, token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Registration failed")
    }
  },
)

// Admin specialized login
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await AuthAdmin.login(credentials.email, credentials.password)
      if (response.success && response.token) {
        const user = response.admin as User
        
        if (user.role !== "admin" && user.role !== "superadmin") {
          return rejectWithValue("Access denied. Not an admin account.")
        }

        localStorage.setItem("token", response.token)
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("adminToken", response.token)
        localStorage.setItem("adminData", JSON.stringify(user))
        return { user, token: response.token }
      }
      return rejectWithValue(response.message || "Admin login failed")
    } catch (error: any) {
      return rejectWithValue(error.message || "Admin login failed")
    }
  },
)

// Rider specialized login
export const riderLogin = createAsyncThunk(
  "rider/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await riderService.login(credentials.email, credentials.password)
      if (!response.success) return rejectWithValue(response.message || "Login failed")
      
      // response is { success, data: { user, token } }
      const { user, token } = response.data
      
      if (user?.role !== "rider") return rejectWithValue("Access denied: Not a rider account")
      
      // Sync to general storage for unified auth state
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      
      return { user, token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Login failed")
    }
  }
)

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    userData: { name?: string; phone?: string; address?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put<ApiResponse<User>>("/auth/profile", userData)
      const user = response.data.data
      localStorage.setItem("user", JSON.stringify(user))
      return user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Profile update failed")
    }
  },
)

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    passwordData: { currentPassword: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      await api.put("/auth/change-password", passwordData)
      return "Password changed successfully"
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Password change failed")
    }
  },
)

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<User>>("/auth/me")
      const user = (response.data as any).user || response.data.data
      localStorage.setItem("user", JSON.stringify(user))
      return user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch profile")
    }
  }
)
