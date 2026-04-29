import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import api from "../../services/api"
import type { Restaurant, ApiResponse } from "../../types"

interface RestaurantState {
  restaurants: Restaurant[]
  currentRestaurant: Restaurant | null
  isLoading: boolean
  error: string | null
  filters: {
    cuisine: string
    rating: number
    priceRange: string
    search: string
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const initialState: RestaurantState = {
  restaurants: [],
  currentRestaurant: null,
  isLoading: false,
  error: null,
  filters: {
    cuisine: "",
    rating: 0,
    priceRange: "",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1, // safe default
  },
}

// Async thunks
export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchRestaurants",
  async (
    params: {
      page?: number
      limit?: number
      cuisine?: string
      rating?: number
      search?: string
      location?: string
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<
        ApiResponse<{
          restaurants: Restaurant[]
          pagination: { page: number; limit: number; total: number; totalPages: number }
        }>
      >("/restaurants", { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurants")
    }
  },
)

export const fetchRestaurantById = createAsyncThunk(
  "restaurants/fetchRestaurantById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Restaurant>>(`/restaurants/${id}`)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurant")
    }
  },
)

export const registerRestaurant = createAsyncThunk(
  "restaurants/registerRestaurant",
  async (
    restaurantData: {
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
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<ApiResponse<Restaurant>>("/restaurants/register", restaurantData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to register restaurant")
    }
  },
)

export const updateRestaurant = createAsyncThunk(
  "restaurants/updateRestaurant",
  async ({ id, data }: { id: string; data: Partial<Restaurant> }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, data)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update restaurant")
    }
  },
)

const restaurantSlice = createSlice({
  name: "restaurants",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<RestaurantState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        cuisine: "",
        rating: 0,
        priceRange: "",
        search: "",
      }
    },
    setCurrentRestaurant: (state, action: PayloadAction<Restaurant | null>) => {
      state.currentRestaurant = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch restaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        // Safe assignment
        state.restaurants = action.payload?.restaurants || []
        state.pagination = action.payload?.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 }
        state.error = null
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.restaurants = []
        state.pagination = { page: 1, limit: 12, total: 0, totalPages: 1 }
      })
      // Fetch restaurant by ID
      .addCase(fetchRestaurantById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentRestaurant = action.payload
        state.error = null
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Register restaurant
      .addCase(registerRestaurant.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerRestaurant.fulfilled, (state, action) => {
        state.isLoading = false
        state.restaurants = [...state.restaurants, action.payload] // immutable push
        state.error = null
      })
      .addCase(registerRestaurant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Update restaurant
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        const index = state.restaurants.findIndex((r) => r._id === action.payload._id)
        if (index !== -1) {
          state.restaurants[index] = action.payload
        }
        if (state.currentRestaurant?._id === action.payload._id) {
          state.currentRestaurant = action.payload
        }
      })
  },
})

export const { setFilters, clearFilters, setCurrentRestaurant, clearError } = restaurantSlice.actions
export default restaurantSlice.reducer
