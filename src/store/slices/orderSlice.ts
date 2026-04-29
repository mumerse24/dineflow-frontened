import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import api from "../../services/api"
import type { Order, ApiResponse } from "../../types"

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
}

// Async thunks
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (
    orderData: {
      restaurantId: string
      items: Array<{
        menuItem: string
        quantity: number
        specialInstructions?: string
      }>
      deliveryAddress: string
      specialInstructions?: string
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<ApiResponse<Order>>("/orders", orderData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create order")
    }
  },
)

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params: { page?: number; limit?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<
        ApiResponse<{
          orders: Order[]
          pagination: { page: number; limit: number; total: number; totalPages: number }
        }>
      >("/orders", { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders")
    }
  },
)

export const fetchOrderById = createAsyncThunk("orders/fetchOrderById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`)
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch order")
  }
})

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async (
    {
      id,
      status,
    }: {
      id: string
      status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, { status })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update order status")
    }
  },
)

export const cancelOrder = createAsyncThunk("orders/cancelOrder", async (id: string, { rejectWithValue }) => {
  try {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`)
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to cancel order")
  }
})

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    clearOrders: (state) => {
      state.orders = []
      state.currentOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders.unshift(action.payload)
        state.currentOrder = action.payload
        state.error = null
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.orders
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
        state.error = null
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order._id === action.payload._id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload
        }
      })
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order._id === action.payload._id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload
        }
      })
  },
})

export const { setCurrentOrder, clearError, clearOrders } = orderSlice.actions
export default orderSlice.reducer
