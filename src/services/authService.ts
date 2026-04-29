import api from "./api"
import type { User, ApiResponse } from "../types"

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", { email, password })
    return response.data
  },

  register: async (userData: {
    name: string
    email: string
    password: string
    phone?: string
    role?: "customer" | "restaurant"
  }) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", userData)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>("/auth/profile")
    return response.data
  },

  updateProfile: async (userData: {
    name?: string
    phone?: string
    address?: string
  }) => {
    const response = await api.put<ApiResponse<User>>("/auth/profile", userData)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
}
