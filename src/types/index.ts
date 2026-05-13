export interface User {
  _id: string
  name: string
  email: string
  role: "customer" | "restaurant" | "admin" | "superadmin" | "rider"
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    coordinates?: { lat: number; lng: number }
  }
  isActive?: boolean
  riderStatus?: "available" | "busy" | "offline"
  createdAt: string
  updatedAt?: string
  loyaltyPoints?: number
  activeOrderCount?: number
  stats?: {
    totalDeliveries: number
    totalEarnings: number
    pendingCashToRemit: number
  }
  savedAddresses?: Array<{
    _id: string
    name: string
    address: string
    city?: string
    state?: string
    zipCode?: string
    coordinates?: { lat: number; lng: number }
    isDefault?: boolean
  }>
}

export interface Restaurant {
  _id: string
  name: string
  description: string
  cuisine: string
  address: string
  phone: string
  email: string
  image: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  isOpen: boolean
  status: "pending" | "approved" | "rejected" | "suspended"
  owner: string | User
  createdAt: string
  updatedAt?: string
}

export interface MenuItem {
  _id: string
  restaurant: string | Restaurant

  // Basic Info
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number

  // Media
  images: string[]  // ✅ Fixed: string[] instead of never[]
  image?: string     // For backward compatibility

  // Availability & Status
  isAvailable: boolean
  isPopular: boolean
  isFeatured: boolean
  isDeal: boolean
  discountPercentage: number
  dealItems?: string[]

  // Dietary & Preparation
  dietaryTags: string[]  // ✅ Fixed: string[] instead of never[]
  spiceLevel?: "Mild" | "Medium" | "Hot" | "Extra Hot"
  preparationTime?: string

  // Ingredients & Allergens
  ingredients?: string[]
  allergens?: string[]

  // Nutritional Info
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }

  // Customizations
  customizations?: Array<{
    name: string
    options: Array<{
      name: string
      price: number
    }>
    required?: boolean
    multiSelect?: boolean
  }>

  // Ratings & Stats
  rating?: {
    average: number
    count: number
  }
  orderCount?: number

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
  removedIngredients?: string[]
  spiceLevel?: "Mild" | "Medium" | "Hot" | "Extra Hot"
  selectedCustomizations?: Array<{
    name: string
    option: string
    price: number
  }>
}

export interface Order {
  _id: string
  orderNumber: string
  customer: string | User
  restaurant: string | Restaurant
  items: Array<{
    menuItem: string | MenuItem
    name: string
    price: number
    quantity: number
    customizations: any[]
    itemTotal: number
    specialInstructions?: string
  }>
  pricing: {
    subtotal: number
    deliveryFee: number
    serviceFee: number
    tax: number
    discount: number
    total: number
  }
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    instructions?: string
  }
  contactInfo: {
    phone: string
    email: string
    fullName?: string
  }
  paymentInfo: {
    method: string
    status: string
    transactionId?: string
    paidAt?: string
  }
  status: "pending" | "confirmed" | "assigned" | "preparing" | "ready" | "picked_up" | "on_the_way" | "out_for_delivery" | "delivered" | "cancelled" | "rejected" | "refunded"
  orderType: "delivery" | "pickup" | "dine-in"
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  movement_start_at?: string
  specialInstructions?: string
  assignedDriver?: string | User
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  total?: number
  pagination?: {
    current: number
    pages: number
    total: number
    limit: number
  }
}

export interface Filters {
  categories: string[]
  cuisines: string[]
  rating: string
  price: string
  isAvailable?: boolean
  isPopular?: boolean
  search?: string
}

export interface ApiError {
  message: string
  status: number
  errors?: any[]
}

export interface Review {
  _id: string
  user: string | User
  userName: string
  menuItem: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface Feedback {
  _id: string
  user?: string | User
  name: string
  email: string
  phone?: string
  subject: "General Inquiry" | "Restaurant Partnership" | "Technical Support" | "Delivery Issue" | "Feedback" | "Complaint"
  message: string
  status: "Pending" | "Reviewed" | "Resolved"
  createdAt: string
  updatedAt: string
}

export interface GroupOrderMember {
  user: string
  name: string
  items: Array<{
    menuItem: MenuItem
    quantity: number
    customizations?: any[]
    specialInstructions?: string
  }>
}

export interface GroupOrder {
  _id: string
  host: string
  restaurant: Restaurant
  inviteCode: string
  status: "open" | "closed" | "completed"
  members: GroupOrderMember[]
  createdAt: string
  updatedAt: string
}