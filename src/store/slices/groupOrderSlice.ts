import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../services/api"
import { ApiResponse } from "../../types"

interface GroupOrderState {
    currentGroupOrder: any | null
    loading: boolean
    error: string | null
}

const initialState: GroupOrderState = {
    currentGroupOrder: null,
    loading: false,
    error: null,
}

export const createGroupOrder = createAsyncThunk(
    "groupOrder/create",
    async (restaurantId: string, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<any>>("/group-orders/create", { restaurantId })
            return response.data.data
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to create group order")
        }
    }
)

export const fetchGroupOrder = createAsyncThunk(
    "groupOrder/fetch",
    async (inviteCode: string, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<any>>(`/group-orders/${inviteCode}`)
            return response.data.data
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch group order")
        }
    }
)

export const joinGroupOrder = createAsyncThunk(
    "groupOrder/join",
    async (inviteCode: string, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<any>>(`/group-orders/${inviteCode}/join`)
            return response.data.data
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to join group order")
        }
    }
)

const groupOrderSlice = createSlice({
    name: "groupOrder",
    initialState,
    reducers: {
        clearGroupOrder: (state) => {
            state.currentGroupOrder = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createGroupOrder.pending, (state) => {
                state.loading = true
            })
            .addCase(createGroupOrder.fulfilled, (state, action) => {
                state.loading = false
                state.currentGroupOrder = action.payload
            })
            .addCase(fetchGroupOrder.fulfilled, (state, action) => {
                state.currentGroupOrder = action.payload
            })
            .addCase(joinGroupOrder.fulfilled, (state, action) => {
                state.currentGroupOrder = action.payload
            })
    }
})

export const { clearGroupOrder } = groupOrderSlice.actions
export default groupOrderSlice.reducer
