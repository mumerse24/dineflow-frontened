import api from "./api"
import type { Order, ApiResponse } from "../types"

export const orderService = {
  createOrder: async (orderData: {
    restaurantId: string
    items: Array<{
      menuItem: string
      quantity: number
      specialInstructions?: string
    }>
    deliveryAddress: string
    specialInstructions?: string
  }) => {
    const response = await api.post<ApiResponse<Order>>("/orders", orderData)
    return response.data
  },

  getOrders: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const response = await api.get<
      ApiResponse<{
        orders: Order[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    >("/orders", { params })
    return response.data
  },

  getOrderById: async (id: string) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`)
    return response.data
  },

  updateOrderStatus: async (
    id: string,
    status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled",
  ) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, { status })
    return response.data
  },

  cancelOrder: async (id: string) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`)
    return response.data
  },

  trackOrder: async (id: string) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}/track`)
    return response.data
  },
}
