import api from "./api"
import type { ApiResponse } from "../types"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export const contactService = {
  submitContactForm: async (formData: ContactFormData) => {
    const response = await api.post<ApiResponse<{ message: string }>>("/contact", formData)
    return response.data
  },

  getContactMessages: async (
    params: {
      page?: number
      limit?: number
      status?: "new" | "read" | "replied"
    } = {},
  ) => {
    const response = await api.get<
      ApiResponse<{
        messages: Array<{
          _id: string
          name: string
          email: string
          subject: string
          message: string
          status: "new" | "read" | "replied"
          createdAt: string
        }>
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    >("/admin/contact", { params })
    return response.data
  },

  markMessageAsRead: async (messageId: string) => {
    const response = await api.put(`/admin/contact/${messageId}/read`)
    return response.data
  },

  replyToMessage: async (messageId: string, reply: string) => {
    const response = await api.post(`/admin/contact/${messageId}/reply`, { reply })
    return response.data
  },
}
