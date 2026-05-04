"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { clearCart, clearCartServer, setOrderType } from "@/store/slices/cartSlice"
import { getProfile } from "@/store/thunks/authThunks"
import { toast } from "sonner"
import { ArrowLeft, CreditCard, Wallet, MapPin, CheckCircle, Bike, ShoppingBag, UtensilsCrossed, Lock, Calendar, Clock, Users, Plus, Minus, CheckCircle2, AlertCircle, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import api from "@/services/api"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Select } from "@/components/ui/select"

// Load Stripe outside of component render to avoid re-creation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Stripe CardElement style options
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a1a',
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
      iconColor: '#3b82f6',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
}


function CheckoutPageInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const stripe = useStripe()
  const elements = useElements()
  const cart = useAppSelector((state) => state.cart)
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)

  // Get restaurantId from cart or location state (for reservation-only mode)
  const restaurantId = cart.restaurantId || location.state?.restaurantId

  // Loyalty Points State
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const availablePoints = user?.loyaltyPoints || 0
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressName, setAddressName] = useState("")

  interface CheckoutFormData {
    fullName: string
    phone: string
    address: string
    city: string
    deliveryInstructions: string
    paymentMethod: string
    deliveryTime: string
    orderType: "delivery" | "pickup" | "dine-in"
    mobileNumber: string
    cardNumber: string
    expiryDate: string
    cvv: string
    cardName: string
    tableNumber: string
    reservationDate: string
    reservationTime: string
    peopleCount: number
    pickupTime: string
    coordinates: { lat: number; lng: number } | null
  }

  // Form state
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    deliveryInstructions: "",
    paymentMethod: "cash",
    deliveryTime: "30",
    orderType: cart.orderType || (location.state?.orderType as any) || "delivery",
    // ✅ NEW FIELDS FOR PAYMENTS
    mobileNumber: "", // For JazzCash/EasyPaisa
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    tableNumber: "", // For Dine-in
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: "19:00",
    peopleCount: 2,
    pickupTime: "",
    coordinates: null,
  })

  useEffect(() => {
    dispatch(getProfile())

    // Auto-fetch location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
          console.log("📍 Captured exact coordinates:", position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.log("Geolocation info:", error.message)
        }
      )
    }
  }, [dispatch])

  useEffect(() => {
    setFormData(prev => ({ ...prev, orderType: cart.orderType }))
  }, [cart.orderType])


  // Order type options
  const orderTypes = [
    { value: "delivery", label: "Delivery", icon: <Bike className="w-6 h-6 mb-2" /> },
    { value: "pickup", label: "Pickup", icon: <ShoppingBag className="w-6 h-6 mb-2" /> },
    { value: "dine-in", label: "Dine-in", icon: <UtensilsCrossed className="w-6 h-6 mb-2" /> },
  ]

  // Delivery time options
  const deliveryTimes = [
    { value: "30", label: "30 minutes (Fastest)" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
  ]

  // Payment methods
  const paymentMethods = [
    {
      id: "cash",
      label: "Cash on Delivery",
      icon: <Wallet className="w-5 h-5 text-amber-600" />,
      color: "border-amber-500 bg-amber-50"
    },
    {
      id: "card",
      label: "Credit/Debit Card",
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      color: "border-blue-500 bg-blue-50"
    },
  ]

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.totalAmount
    const tax = 0
    const deliveryFee = formData.orderType === "delivery" ? 150.00 : 0
    const autoDiscount = subtotal > 1000 ? 100 : 0
    const loyaltyDiscount = subtotal * (Math.floor(pointsToRedeem / 100) * 0.03)

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      discount: Number((autoDiscount + loyaltyDiscount).toFixed(2)),
      total: Number((subtotal + tax + deliveryFee - autoDiscount - loyaltyDiscount).toFixed(2))
    }
  }

  const totals = calculateTotals()

  // Dynamic ETA Algorithm
  const computeDynamicETA = () => {
    // Base preparation time: 15 minutes
    const basePrep = 15;
    // Add 2 extra minutes of prep per item 
    const itemLoad = cart.totalItems * 2;
    // Base transit time (Defaulting to 12 minutes for local radius)
    const transitTime = formData.orderType === "delivery" ? 12 : 0;
    
    return basePrep + itemLoad + transitTime;
  }

  const dynamicETA = computeDynamicETA();

  const [availability, setAvailability] = useState<{ isAvailable: boolean, availableTables: number } | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const timeSlots = [
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ]

  // Check availability when date/time/restaurant changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.orderType === "dine-in" && restaurantId) {
        setCheckingAvailability(true)
        try {
          const dateTime = `${formData.reservationDate}T${formData.reservationTime}`
          const response = await api.get(`/orders/availability/${restaurantId}`, {
            params: { dateTime, peopleCount: formData.peopleCount }
          })
          if (response.data.success) {
            setAvailability({
              isAvailable: response.data.isAvailable,
              availableTables: response.data.availableTables
            })
          }
        } catch (error) {
          console.error("Failed to check availability:", error)
        } finally {
          setCheckingAvailability(false)
        }
      } else {
        setAvailability(null)
      }
    }

    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [formData.reservationDate, formData.reservationTime, formData.peopleCount, formData.orderType, restaurantId])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  // ✅ NEW FUNCTION: Handle radio button change
  // Handle radio change for payment method
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }))

    // Additional inputs logic removed for now as UI wasn't implemented
  }
  // Handle select change for delivery time
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))
  }

  // Place order
  const handlePlaceOrder = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name")
      return
    }
    if (!formData.phone.trim() || formData.phone.length < 11) {
      toast.error("Please enter a valid phone number")
      return
    }
    if (formData.orderType === "delivery") {
      const address = formData.address.trim()
      const city = formData.city.trim()

      if (!address) {
        toast.error("Please enter your delivery address")
        return
      }
      if (address.length < 10) {
        toast.error("Address is too short. Please provide a complete address.")
        return
      }
      if (!/\s/.test(address)) {
        toast.error("Please provide a more detailed address (e.g., House No, Street, Area).")
        return
      }
      if (!/\d/.test(address)) {
        toast.error("Please include a house or building number in your address.")
        return
      }

      if (!city) {
        toast.error("Please enter your city")
        return
      }
      if (city.length < 3) {
        toast.error("Please enter a valid city name.")
        return
      }
    }

    if (formData.orderType === "dine-in") {
      if (!formData.reservationDate) {
        toast.error("Please select a reservation date")
        return
      }
      if (!formData.reservationTime) {
        toast.error("Please select a reservation time")
        return
      }
      if (formData.peopleCount < 1) {
        toast.error("Please select at least 1 person")
        return
      }
      if (availability && !availability.isAvailable) {
        toast.error("Sorry, this time slot is fully booked. Please choose another time.")
        return
      }
    } else {
      if (cart.items.length === 0) {
        toast.error("Your cart is empty!")
        return
      }
    }

    setLoading(true)

    // ✅ RECOVERY: Ensure restaurantId is present
    let finalRestaurantId = restaurantId // Using the derived one from top of component
    if (!finalRestaurantId && cart.items.length > 0) {
      const firstItemRest = cart.items[0].menuItem?.restaurant
      finalRestaurantId = typeof firstItemRest === 'object' ? (firstItemRest as any)._id : firstItemRest
      console.log("♻️ Recovered restaurantId from items:", finalRestaurantId)
    }

    if (!finalRestaurantId) {
      toast.error("Restaurant information is missing. Please refresh or try again.")
      setLoading(false)
      return
    }

    try {
      let stripePaymentIntentId: string | undefined = undefined

      // ━━━ STRIPE CARD PAYMENT ━━━
      if (formData.paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast.error("Stripe is not loaded yet. Please wait a moment.")
          setLoading(false)
          return
        }
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          toast.error("Card information is incomplete.")
          setLoading(false)
          return
        }

        toast.loading("Authorizing card payment...", { id: "stripe-pay" })

        // Step 1: Create Payment Intent on backend
        const intentRes = await api.post("/payment/create-intent", { amount: totals.total })
        if (!intentRes.data.success) throw new Error(intentRes.data.message)
        const { clientSecret } = intentRes.data

        // Step 2: Confirm card payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: formData.fullName }
          }
        })

        if (stripeError) {
          toast.error(stripeError.message || "Card payment failed.", { id: "stripe-pay" })
          setLoading(false)
          return
        }

        if (paymentIntent?.status !== 'succeeded') {
          toast.error("Payment not completed. Please try again.", { id: "stripe-pay" })
          setLoading(false)
          return
        }

        stripePaymentIntentId = paymentIntent.id
        toast.success("Card authorized! Placing order...", { id: "stripe-pay" })
      }

      // ━━━ PLACE ORDER IN DB ━━━
      const orderData = {
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.orderType === "delivery" ? formData.address : "N/A",
          city: formData.orderType === "delivery" ? formData.city : "N/A",
          deliveryInstructions: formData.deliveryInstructions,
        },
        items: cart.items,
        totals: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          deliveryFee: totals.deliveryFee,
          discount: totals.discount,
          total: totals.total,
        },
        paymentMethod: formData.paymentMethod,
        deliveryTime: formData.deliveryTime,
        restaurantId: cart.restaurantId,
        orderType: formData.orderType,
        tableNumber: formData.orderType === "dine-in" ? formData.tableNumber : null,
        paymentDetails: {
          mobileNumber: formData.mobileNumber,
          cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Masked
          cardName: formData.cardName
        }
      }

      console.log("Placing order:", orderData)

      // ✅ REAL API CALL to backend
      const response = await api.post("/orders", {
        restaurant: finalRestaurantId,
        items: cart.items.map(item => ({
          menuItem: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          customizations: item.selectedCustomizations?.map(c => ({
            name: c.name,
            selectedOptions: [{ name: c.option, price: c.price }]
          })) || [],
          itemTotal: item.menuItem.price * item.quantity,
          specialInstructions: item.specialInstructions || ""
        })),
        deliveryAddress: {
          street: formData.address,
          city: formData.city,
          state: "N/A",
          zipCode: "N/A",
          coordinates: formData.coordinates
        },
        contactInfo: {
          phone: formData.phone,
          email: "customer@example.com",
          fullName: formData.fullName
        },
        paymentInfo: {
          method: formData.paymentMethod === 'cash' ? 'Cash' :
            formData.paymentMethod === 'card' ? 'Card' : 'Digital Wallet',
          status: formData.paymentMethod === 'card' ? 'paid' : 'pending',
          stripePaymentIntentId: stripePaymentIntentId
        },
        orderType: formData.orderType,
        specialInstructions: formData.deliveryInstructions,
        tableNumber: formData.orderType === "dine-in" ? formData.tableNumber : null,
        estimatedDeliveryTimeMinutes: dynamicETA,
        paymentDetails: {
          mobileNumber: formData.mobileNumber,
          cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Masked
          cardName: formData.cardName
        },
        reservationDateTime: formData.orderType === "dine-in" 
          ? `${formData.reservationDate}T${formData.reservationTime}` 
          : null,
        peopleCount: formData.orderType === "dine-in" ? formData.peopleCount : null,
        pickupTime: formData.orderType === "pickup" ? formData.pickupTime : null,
        usePoints: pointsToRedeem > 0,
        pointsToRedeem: pointsToRedeem
      })

      if (response.data.success) {
        setIsSuccess(true)
        // Optionally Save Address for long term
        if (saveAddress && addressName) {
          try {
            await api.post("/auth/saved-addresses", {
              name: addressName,
              address: formData.address,
              city: formData.city,
              coordinates: formData.coordinates
            })
          } catch (saveErr) {
            console.error("Failed to save address:", saveErr)
          }
        }

        // Clear cart (backend already cleared it, so don't let failures block us)
        try {
          await dispatch(clearCartServer()).unwrap()
        } catch (cartErr) {
          console.warn("Cart already cleared by server:", cartErr)
        }
        dispatch(clearCart())

        // Refresh profile to update loyalty points
        try {
          await dispatch(getProfile() as any).unwrap()
        } catch (profileErr) {
          console.warn("Profile refresh failed:", profileErr)
        }

        toast.success("🎉 Order placed successfully!")

        // Navigate to order success page
        navigate("/order-success", {
          state: {
            orderId: response.data.data._id,
            orderNumber: response.data.data.orderNumber,
            customerName: formData.fullName,
            totalAmount: totals.total,
            orderType: formData.orderType
          }
        })
      } else {
        throw new Error(response.data.message || "Failed to place order")
      }


    } catch (error: any) {
      console.error("Order placement failed:", error)
      const errorMsg = error.response?.data?.message || "Failed to place order. Please try again."
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const [isSuccess, setIsSuccess] = useState(false)
  
  // If cart is empty (Allow empty cart for Dine-In reservations)
  if (formData.orderType !== "dine-in" && cart.items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Your cart is empty</CardTitle>
              <CardDescription>
                Add some delicious items to your cart first!
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/menu")}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Menu
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            {!restaurantId && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="text-red-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Restaurant Selected</h3>
                      <p className="text-sm text-gray-500 font-medium">Please select a restaurant to proceed with your reservation.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/menu')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                  >
                    Go to Menu
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Order Type Selection */}
            <Card className={formData.orderType === "dine-in" ? "border-amber-200 bg-amber-50/30" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                  Order Mode: <span className="text-amber-600 uppercase tracking-tighter ml-1">Dine-In</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.orderType === "dine-in" ? (
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                        <UtensilsCrossed className="text-amber-600 w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight">Table Reservation Flow</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Other options are disabled in this mode</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {orderTypes.map((type) => (
                      <Label
                        key={type.value}
                        className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ring-offset-2 ${formData.orderType === type.value
                          ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500"
                          : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="orderType"
                          value={type.value}
                          checked={formData.orderType === type.value}
                          onChange={(e) => setFormData((prev) => ({ ...prev, orderType: e.target.value as any }))}
                          className="sr-only"
                        />
                        {type.icon}
                        <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                      </Label>
                    ))}
                  </div>
                )}

                {formData.orderType === "dine-in" && (
                  <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Date Picker */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          Select Date
                        </Label>
                        <Input
                          type="date"
                          name="reservationDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.reservationDate}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:ring-amber-500"
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          Preferred Time
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, reservationTime: time }))}
                              className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                formData.reservationTime === time 
                                  ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200" 
                                  : "bg-white border-gray-100 text-gray-500 hover:border-amber-200"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* People Counter */}
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <Users className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900">Number of People</p>
                          <p className="text-xs text-gray-500 font-bold">How many guests are joining?</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-inner border border-amber-100">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, peopleCount: Math.max(1, prev.peopleCount - 1) }))}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-amber-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-black text-gray-900 min-w-[20px] text-center">{formData.peopleCount}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, peopleCount: prev.peopleCount + 1 }))}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-amber-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="tableNumber" className="text-gray-700 font-bold">Special Requests / Table Pref (Optional)</Label>
                      <Input
                        id="tableNumber"
                        name="tableNumber"
                        placeholder="e.g., Near window, Quiet area..."
                        value={formData.tableNumber}
                        onChange={handleInputChange}
                        className="h-12 rounded-xl border-gray-200 focus:ring-amber-500"
                      />
                    </div>

                    {/* Availability Status */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                      checkingAvailability ? "bg-gray-50 border-gray-100" :
                      availability?.isAvailable ? "bg-green-50 border-green-100 text-green-700" :
                      "bg-red-50 border-red-100 text-red-700"
                    }`}>
                      {checkingAvailability ? (
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      ) : availability?.isAvailable ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <p className="text-sm font-bold">
                        {checkingAvailability ? "Checking table availability..." :
                         availability?.isAvailable ? `Table available! (${availability.availableTables} left)` :
                         "Fully Booked for this time slot"}
                      </p>
                    </div>
                  </div>
                )}

                {formData.orderType === "pickup" && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <ShoppingBag className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900">Self-Pickup Order</h4>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Your order will be ready for collection in approximately <span className="text-blue-600 font-black">{dynamicETA} minutes</span>.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                         <div className="flex-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pickup Time (Optional)</Label>
                            <Input 
                              type="time" 
                              name="pickupTime"
                              value={formData.pickupTime}
                              onChange={handleInputChange}
                              className="h-10 bg-white border-blue-100 rounded-lg text-sm"
                            />
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery/Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {formData.orderType === "delivery" ? "Delivery Information" : "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Saved Addresses Quick Select */}
                {formData.orderType === "delivery" && user?.savedAddresses && user.savedAddresses.length > 0 && (
                  <div className="pb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Saved Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {user.savedAddresses.map((addr: any) => (
                        <Button
                          key={addr._id}
                          variant="outline"
                          size="sm"
                          className={`rounded-full border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all ${formData.address === addr.address ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500' : ''
                            }`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              address: addr.address,
                              city: addr.city || prev.city,
                              coordinates: addr.coordinates || prev.coordinates
                            }))
                            setAddressName(addr.name)
                          }}
                        >
                          <MapPin className="w-3 h-3 mr-1 text-amber-500" />
                          {addr.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="03XX XXXXXXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {formData.orderType === "delivery" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address *</Label>

                      <textarea
                        id="address"
                        name="address"
                        placeholder="House #, Street, Area"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent mt-4"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="e.g., Karachi"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Delivery</Label>
                        <div className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                          <Bike className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{dynamicETA} Minutes</p>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide">COMPUTED BY AI TRAFFIC ENGINE</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                      <textarea
                        id="deliveryInstructions"
                        name="deliveryInstructions"
                        placeholder="e.g., Call before delivery, Leave at gate, etc."
                        value={formData.deliveryInstructions}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2 pb-4">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <Label htmlFor="saveAddress" className="text-sm font-semibold text-gray-700 cursor-pointer">
                        Save this location for future orders
                      </Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="relative">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={() => handleRadioChange(method.id)}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.paymentMethod === method.id
                          ? method.color + " ring-2 ring-offset-1"
                          : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                      >
                        <div className={`p-2 rounded-full ${formData.paymentMethod === method.id ? 'bg-white' : 'bg-gray-50'}`}>
                          {method.icon}
                        </div>
                        <span className="font-semibold">{method.label}</span>
                        {formData.paymentMethod === method.id && (
                          <div className="ml-auto bg-white rounded-full p-0.5">
                            <CheckCircle className="w-4 h-4 text-inherit" />
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>


                  {formData.paymentMethod === "card" && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-gray-900">Secure Card Payment</h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-medium">
                          <Lock className="w-3 h-3" />
                          Secured by Stripe
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          name="cardName"
                          placeholder="AS APPEARS ON CARD"
                          className="bg-white border-gray-200 focus:ring-blue-500 uppercase font-mono"
                          value={formData.cardName}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Stripe Secure Card Element */}
                      <div className="space-y-2">
                        <Label>Card Details</Label>
                        <div className="bg-white border border-gray-200 rounded-md px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                          <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Test card: <span className="font-mono font-bold text-blue-600">4242 4242 4242 4242</span> • Any future date • Any 3-digit CVV
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} in cart</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                  {cart.items.map((item) => (
                    <div key={item.menuItem._id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.menuItem.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × Rs. {item.menuItem.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        Rs. {(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rs. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  {availablePoints > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Use DinePoints</span>
                        <span className="text-[10px] text-amber-600">Bal: {availablePoints} Pts</span>
                      </div>
                      {availablePoints >= 100 ? (
                        <select
                          className="text-xs border rounded-md p-1.5 border-amber-200 bg-amber-50 text-amber-900 focus:ring-amber-500 focus:border-amber-500 font-medium max-w-[140px] cursor-pointer"
                          value={pointsToRedeem}
                          onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                        >
                          <option value={0}>Don't use points</option>
                          {Array.from({ length: Math.floor(availablePoints / 100) }, (_, i) => (i + 1) * 100).map(pts => (
                            <option key={pts} value={pts}>
                              {pts} Pts (-Rs. {(totals.subtotal * (pts / 100) * 0.03).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic max-w-[120px] text-right leading-tight">
                          Need {100 - (availablePoints % 100)} more Pts for 3% discount
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>Rs. {totals.deliveryFee.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>- Rs. {totals.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rs. {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full h-16 rounded-[24px] text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    formData.orderType === "dine-in" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-[#FF5C00] hover:bg-[#FF7A00] shadow-orange-200"
                  }`}
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || (formData.orderType === "dine-in" && availability?.isAvailable === false)}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {formData.orderType === "dine-in" ? "Reserving..." : "Processing Order..."}
                    </>
                  ) : (
                    <>
                      {formData.orderType === "dine-in" ? <Calendar className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {formData.orderType === "dine-in" ? "Confirm Reservation" : "Place Order & Pay"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Security Note */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">Secure Checkout</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Your payment information is secure. We don't store your credit card details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap inner component with Stripe Elements provider
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPageInner />
    </Elements>
  )
}