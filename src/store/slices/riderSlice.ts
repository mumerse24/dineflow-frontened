import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { riderService } from "../../services/riderService"
import { riderLogin } from "../thunks/authThunks"

interface RiderOrder {
    _id: string
    orderNumber: string
    status: string
    customer: { name: string; phone: string; address?: any }
    restaurant: { name: string; address?: any; phone?: string }
    deliveryAddress: {
        street: string
        city: string
        state: string
        zipCode: string
        instructions?: string
    }
    pricing: { total: number; deliveryFee: number }
    paymentInfo: { method: string; status: string }
    contactInfo: { phone: string; email: string }
    timeline: { status: string; timestamp: string; note?: string }[]
    createdAt: string
    updatedAt: string
    actualDeliveryTime?: string
}

interface RiderProfile {
    _id: string
    name: string
    email: string
    phone: string
    riderStatus: string
    isActive: boolean
    stats: {
        totalDeliveries: number
        totalEarnings: number
        pendingCashToRemit: number
    }
}

interface RiderState {
    orders: RiderOrder[]
    history: RiderOrder[]
    profile: RiderProfile | null
    isLoading: boolean
    error: string | null
    isAuthenticated: boolean
}

const initialState: RiderState = {
    orders: [],
    history: [],
    profile: null,
    isLoading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem("riderToken"),
}

export const fetchRiderOrders = createAsyncThunk(
    "rider/fetchOrders",
    async (_, { rejectWithValue }) => {
        try {
            const response = await riderService.getMyOrders()
            return response.data || []
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to fetch orders")
        }
    }
)

export const updateRiderOrderStatus = createAsyncThunk(
    "rider/updateOrderStatus",
    async (payload: { orderId: string; status: string; note?: string }, { rejectWithValue }) => {
        try {
            const response = await riderService.updateOrderStatus(payload.orderId, payload.status, payload.note)
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to update status")
        }
    }
)

export const notifyRiderArrival = createAsyncThunk(
    "rider/notifyArrival",
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await riderService.notifyArrival(orderId)
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to notify arrival")
        }
    }
)

export const fetchRiderHistory = createAsyncThunk(
    "rider/fetchHistory",
    async (_, { rejectWithValue }) => {
        try {
            const response = await riderService.getHistory()
            return response.data || []
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to fetch history")
        }
    }
)

export const fetchRiderProfile = createAsyncThunk(
    "rider/fetchProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await riderService.getProfile()
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to fetch profile")
        }
    }
)

export const toggleRiderStatus = createAsyncThunk(
    "rider/toggleStatus",
    async (status: "available" | "offline", { rejectWithValue }) => {
        try {
            const response = await riderService.updateStatus(status)
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.data?.message || "Failed to update status")
        }
    }
)

// ============ Slice ============

const riderSlice = createSlice({
    name: "rider",
    initialState,
    reducers: {
        riderLogout: (state) => {
            state.isAuthenticated = false
            state.profile = null
            state.orders = []
            state.history = []
            riderService.logout()
        },
        clearRiderError: (state) => {
            state.error = null
        },
        addAssignedOrder: (state, action) => {
            const order = action.payload
            if (!state.orders.find(o => o._id === order._id)) {
                state.orders.unshift(order)
            }
        },
        updateProfileStatus: (state, action) => {
            if (state.profile) {
                state.profile.riderStatus = action.payload
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(riderLogin.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(riderLogin.fulfilled, (state) => {
                state.isLoading = false
                state.isAuthenticated = true
                state.error = null // ✅ Ensure error is cleared on success
            })
            .addCase(riderLogin.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            // Fetch Orders
            .addCase(fetchRiderOrders.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchRiderOrders.fulfilled, (state, action) => {
                state.isLoading = false
                state.orders = action.payload
            })
            .addCase(fetchRiderOrders.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            // Update Status
            .addCase(updateRiderOrderStatus.fulfilled, (state, action) => {
                const updated = action.payload
                if (!updated) return
                // Update in active orders
                const idx = state.orders.findIndex(o => o._id === updated._id)
                if (idx !== -1) {
                    if (["delivered", "cancelled"].includes(updated.status)) {
                        state.orders.splice(idx, 1)
                        state.history.unshift(updated)
                    } else {
                        state.orders[idx] = updated
                    }
                }
            })
            .addCase(updateRiderOrderStatus.rejected, (state, action) => {
                state.error = action.payload as string
            })
            // Notify Arrival
            .addCase(notifyRiderArrival.fulfilled, (state) => {
                // Success handled locally by components (e.g. toasts)
            })
            .addCase(notifyRiderArrival.rejected, (state, action) => {
                state.error = action.payload as string
            })
            // Fetch History
            .addCase(fetchRiderHistory.pending, (state) => {
                state.isLoading = true
            })
            .addCase(fetchRiderHistory.fulfilled, (state, action) => {
                state.isLoading = false
                state.history = action.payload
            })
            .addCase(fetchRiderHistory.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            // Fetch Profile
            .addCase(fetchRiderProfile.fulfilled, (state, action) => {
                state.profile = action.payload
            })
            // Toggle Rider Status
            .addCase(toggleRiderStatus.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(toggleRiderStatus.fulfilled, (state, action) => {
                state.isLoading = false
                state.profile = action.payload
            })
            .addCase(toggleRiderStatus.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            // Cross-clear when other roles login (placed at end for type safety)
            .addMatcher(
                (action: any) => action.type.startsWith('auth/login') || action.type.startsWith('auth/register'),
                (state: any) => {
                    state.error = null;
                }
            )
    },
})

export const { riderLogout, clearRiderError, addAssignedOrder, updateProfileStatus } = riderSlice.actions
export default riderSlice.reducer
