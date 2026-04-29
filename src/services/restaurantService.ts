import api from "./api"
import type { Restaurant, MenuItem, ApiResponse } from "../types"

export const restaurantService = {
  getRestaurants: async (
    params: {
      page?: number
      limit?: number
      cuisine?: string
      rating?: number
      search?: string
      location?: string
    } = {},
  ) => {
    const response = await api.get<
      ApiResponse<{
        restaurants: Restaurant[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    >("/restaurants", { params })
    return response.data
  },

  getRestaurantById: async (id: string) => {
    const response = await api.get<ApiResponse<Restaurant>>(`/restaurants/${id}`)
    return response.data
  },

  registerRestaurant: async (restaurantData: {
    name: string
    description: string
    cuisine: string
    address: string
    phone: string
    email: string
    image: string
    businessLicense: string
    taxId: string
    bankAccount: string
  }) => {
    const response = await api.post<ApiResponse<Restaurant>>("/restaurants/register", restaurantData)
    return response.data
  },

  updateRestaurant: async (id: string, data: Partial<Restaurant>) => {
    const response = await api.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, data)
    return response.data
  },

  getMenuItems: async (restaurantId: string) => {
    const response = await api.get<ApiResponse<MenuItem[]>>(`/menu/restaurant/${restaurantId}`)
    return response.data
  },

  getMenuCategories: async (restaurantId: string) => {
    const response = await api.get<ApiResponse<string[]>>(`/menu/restaurant/${restaurantId}/categories`)
    return response.data
  },

  createMenuItem: async (menuItemData: {
    restaurant: string
    name: string
    description: string
    price: number
    category: string
    image: string
    ingredients?: string[]
    allergens?: string[]
  }) => {
    const response = await api.post<ApiResponse<MenuItem>>("/menu", menuItemData)
    return response.data
  },

  updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
    const response = await api.put<ApiResponse<MenuItem>>(`/menu/${id}`, data)
    return response.data
  },

  deleteMenuItem: async (id: string) => {
    const response = await api.delete(`/menu/${id}`)
    return response.data
  },
}
