// store/slices/menuSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../services/api"

interface MenuState {
  items: any[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  page: number
  hasMore: boolean
  totalCount: number
}

const initialState: MenuState = {
  items: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  totalCount: 0,
}

// Fetch all menu items — calls GET /api/menu (no restaurantId required)
// Now supports pagination: first call replaces, subsequent calls append
export const fetchAllMenuItems = createAsyncThunk(
  "menu/fetchAllMenuItems",
  async (params: { page?: number; limit?: number; reset?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const page = params?.page || 1
      const limit = params?.limit || 12
      const response = await api.get(`/menu?page=${page}&limit=${limit}`)
      return {
        data: response.data.data, // array of menu items
        hasMore: response.data.hasMore,
        total: response.data.total,
        page,
        reset: params?.reset ?? (page === 1),
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load menu")
    }
  },
  {
    condition: (_, { getState }) => {
      const { menu } = getState() as { menu: MenuState }
      if (menu.isLoading || menu.isLoadingMore) return false
    }
  }
)

// Fetch menu items for a specific restaurant — calls GET /api/menu/restaurant/:restaurantId
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchMenuItems",
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/restaurant/${restaurantId}`)
      return response.data.data // array of menu items
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load menu")
    }
  }
)

export const deleteMenuItem = createAsyncThunk(
  "menu/deleteMenuItem",
  async (itemId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/${itemId}`)
      return itemId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete item")
    }
  }
)

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenu: (state) => {
      state.items = []
      state.page = 1
      state.hasMore = true
      state.totalCount = 0
    },
    resetPagination: (state) => {
      state.page = 1
      state.hasMore = true
      state.items = []
    },
    // Real-time update reducers
    addMenuItem: (state, action) => {
      // Prevent duplicates if it somehow exists
      const exists = state.items.some(item => item._id === action.payload._id)
      if (!exists) {
        state.items.unshift(action.payload) // Add to top
        state.totalCount += 1
      }
    },
    updateMenuItem: (state, action) => {
      const index = state.items.findIndex(item => item._id === action.payload._id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    removeMenuItem: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload)
      state.totalCount = Math.max(0, state.totalCount - 1)
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllMenuItems (with pagination)
      .addCase(fetchAllMenuItems.pending, (state, action) => {
        const isFirstPage = !action.meta.arg || action.meta.arg.page === 1 || action.meta.arg.reset
        if (isFirstPage) {
          state.isLoading = true
        } else {
          state.isLoadingMore = true
        }
        state.error = null
      })
      .addCase(fetchAllMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        state.error = null

        const { data, hasMore, total, page, reset } = action.payload

        if (reset) {
          // ✅ First page or reset: replace items
          state.items = data
        } else {
          // ✅ Subsequent pages: APPEND items, never replace
          const existingIds = new Set(state.items.map((item: any) => item._id))
          const newItems = data.filter((item: any) => !existingIds.has(item._id))
          state.items = [...state.items, ...newItems]
        }

        state.hasMore = hasMore
        state.page = page
        state.totalCount = total
      })
      .addCase(fetchAllMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        state.error = (action.payload as string) || "Failed to load menu"
      })
      // fetchMenuItems (restaurant-specific) — no pagination, full replace
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.error = null
        state.hasMore = false
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to load menu"
      })
      // deleteMenuItem
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item._id !== action.payload && item.id !== action.payload
        )
        state.totalCount = Math.max(0, state.totalCount - 1)
      })
  },
})

export const { clearMenu, resetPagination, addMenuItem, updateMenuItem, removeMenuItem } = menuSlice.actions
export default menuSlice.reducer