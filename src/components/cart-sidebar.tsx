"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Users, Share2, Copy, Check, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  updateQuantity,
  removeFromCart,
  clearCart,
  clearCartServer,
  addToCartServer,
  syncCartWithServer,
  removeFromCartServer
} from "@/store/slices/cartSlice"
import { createGroupOrder } from "@/store/slices/groupOrderSlice"
import type { CartItem as CartItemType } from "@/types"
import { toast } from "sonner"

export function CartSidebar() {
  const dispatch = useAppDispatch()
  const cartState = useAppSelector((state) => state.cart)
  const { currentGroupOrder } = useAppSelector((state) => state.groupOrder)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const { items, totalAmount, totalItems, isLoading: cartLoading } = cartState

  const handleStartGroupOrder = async () => {
    if (!items[0]?.menuItem?.restaurant) {
        toast.error("Please add an item to the cart first")
        return
    }
    const restaurantId = typeof items[0].menuItem.restaurant === 'object' 
        ? items[0].menuItem.restaurant._id 
        : items[0].menuItem.restaurant

    try {
        await dispatch(createGroupOrder(restaurantId)).unwrap()
        setShowInviteModal(true)
        toast.success("Group order session started!")
    } catch (err) {
        toast.error("Failed to start group order")
    }
  }

  const copyInviteLink = () => {
    if (!currentGroupOrder) return
    const link = `${window.location.origin}/group-order/${currentGroupOrder.inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Link copied to clipboard!")
  }

  // Update quantity - sync with server
  // ✅ SAHI FUNCTION


  // Clear cart - sync with server
  const handleClearCart = async () => {
    setLoading(true)
    try {
      // Clear from server first using async thunk
      await dispatch(clearCartServer())

      // Always clear locally to ensure UI isn't stuck
      dispatch(clearCart())
      toast.success("Cart cleared successfully")

    } catch (err) {
      console.error("Failed to clear cart", err)
      dispatch(clearCart()) // Force clear locally if error occurs
      toast.success("Cart cleared locally")
    } finally {
      setLoading(false)
    }
  }

  // Alternative: Simplified version without unwrap()
  const handleRemoveItemSimple = (menuItemId: string) => {
    setLoading(true)
    dispatch(removeFromCart(menuItemId))

    // Fire and forget server call
    dispatch(removeFromCartServer(menuItemId))
      .then(() => {
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to remove from server:", err)
        toast.error("Failed to remove item from server")
        // Sync to get correct state
        dispatch(syncCartWithServer())
        setLoading(false)
      })
  }

  // Navigate to checkout
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!")
      return
    }
    setSheetOpen(false)
    navigate("/checkout")
  }

  // Handle opening cart - sync with server
  const handleOpenCart = async () => {
    setSheetOpen(true)
    try {
      // Sync cart with server when opening
      const resultAction = await dispatch(syncCartWithServer())

      if (syncCartWithServer.rejected.match(resultAction)) {
        toast.warning("Using local cart data")
      }
    } catch (err) {
      console.error("Failed to sync cart", err)
      // Continue with local data
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = totalAmount
    const tax = subtotal * 0.15
    const deliveryFee = 150.00
    const discount = 30.00

    return {
      subtotal,
      tax: Number(tax.toFixed(2)),
      deliveryFee,
      discount,
      total: Number((subtotal + tax + deliveryFee - discount).toFixed(2))
    }
  }

  const totals = calculateTotals()
  const isAnyLoading = loading || cartLoading

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-orange-50 transition-colors"
          onClick={handleOpenCart}
        >
          <ShoppingCart className="w-6 h-6 text-orange-600" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-white border-l-orange-200">
        {/* Header */}
        <div className="px-6 py-6 border-b border-orange-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Your Cart</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                {totalItems} {totalItems === 1 ? 'Item' : 'Items'} Selected
              </p>
              {cartState.orderType === 'dine-in' && (
                <Badge className="bg-amber-100 text-amber-600 border-amber-200 text-[8px] font-black uppercase tracking-widest h-4 px-1.5 py-0">
                  Dine-In Mode
                </Badge>
              )}
            </div>
          </div>
          <button 
            onClick={() => setSheetOpen(false)}
            className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#fffaf5]/30 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-orange-100 rounded-[28px] flex items-center justify-center mb-6 rotate-3">
                <ShoppingCart className="w-8 h-8 text-[#FF5C00] opacity-40" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Empty Cart</h3>
              <p className="text-gray-400 font-medium text-sm mb-8">Hungry? Let's add some treats!</p>
              <Button
                className="w-full bg-[#FF5C00] hover:bg-[#E65200] text-white h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-200"
                onClick={() => {
                  setSheetOpen(false)
                  navigate("/menu")
                }}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItemType, idx) => {
                const menuItem = item.menuItem;
                if (!menuItem) return null;
                
                const itemName = typeof menuItem === 'string' ? "Loading..." : menuItem.name;
                const itemPrice = typeof menuItem === 'string' ? 0 : menuItem.price;
                const itemId = typeof menuItem === 'string' ? `item-${idx}` : menuItem._id;
                
                const getImageUrl = (item: any) => {
                  if (!item || typeof item === 'string') return "/placeholder.svg";
                  
                  let imgPath = null;
                  if (item.images && item.images.length > 0) imgPath = item.images[0];
                  else if (item.image) imgPath = item.image;
                  
                  if (!imgPath) return "/placeholder.svg";
                  if (imgPath.startsWith('http') && !imgPath.includes('placehold')) return imgPath;
                  
                  const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
                  const formattedPath = imgPath.replace(/\\/g, "/");
                  return formattedPath.startsWith('/') ? `${backendUrl}${formattedPath}` : `${backendUrl}/${formattedPath}`;
                };

                const itemImage = getImageUrl(menuItem);

                return (
                  <div key={itemId} className="bg-white rounded-3xl p-3 border border-orange-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-orange-50 border border-orange-50">
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="w-full h-full object-cover"
                        />
                      </div>
 
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                          {itemName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-base font-black text-[#FF5C00]">Rs. {(itemPrice * item.quantity).toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center bg-orange-50/50 rounded-xl p-1 border border-orange-100">
                        <button
                          onClick={() => {
                            if (typeof menuItem !== 'string') {
                              const newQty = item.quantity - 1;
                              if (newQty < 1) handleRemoveItemSimple(menuItem._id);
                              else {
                                dispatch(updateQuantity({ menuItemId: menuItem._id, quantity: newQty }));
                                const rid = typeof menuItem.restaurant === 'object' ? menuItem.restaurant._id : menuItem.restaurant;
                                dispatch(addToCartServer({ menuItemId: menuItem._id, quantity: -1, restaurantId: rid as string }));
                              }
                            }
                          }}
                          disabled={isAnyLoading}
                          className="w-7 h-7 flex items-center justify-center text-[#FF5C00] hover:bg-white rounded-lg transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-gray-900 px-2 min-w-[24px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            if (typeof menuItem !== 'string') {
                              const newQty = item.quantity + 1;
                              dispatch(updateQuantity({ menuItemId: menuItem._id, quantity: newQty }));
                              const rid = typeof menuItem.restaurant === 'object' ? menuItem.restaurant._id : menuItem.restaurant;
                              dispatch(addToCartServer({ menuItemId: menuItem._id, quantity: 1, restaurantId: rid as string }));
                            }
                          }}
                          disabled={isAnyLoading}
                          className="w-7 h-7 flex items-center justify-center text-[#FF5C00] hover:bg-white rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Upsell Suggestion */}
              {items.length > 0 && items.some(i => typeof i.menuItem !== 'string' && i.menuItem?.category === "Burgers") && (
                <div className="bg-[#FF5C00] rounded-3xl p-5 text-white shadow-xl shadow-orange-100 mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Plus className="w-5 h-5" />
                    <h4 className="font-black uppercase tracking-tight text-sm">Smart Upsell</h4>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍟</span>
                      <p className="text-[10px] font-black uppercase leading-tight">Add Fries for Rs. 150?</p>
                    </div>
                    <button className="bg-white text-[#FF5C00] px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm">
                      ADD NOW
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-orange-50">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                <span>Subtotal</span>
                <span>Rs. {totalAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-900 font-black text-lg uppercase tracking-tight">
                <span>Total Amount</span>
                <span className="text-[#FF5C00]">Rs. {totals.total.toFixed(0)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-14 rounded-2xl bg-[#FF5C00] hover:bg-[#E65200] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                onClick={handleCheckout}
                disabled={isAnyLoading}
              >
                {isAnyLoading ? "Syncing..." : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <button
                  onClick={handleStartGroupOrder}
                  className="flex-1 h-11 rounded-xl bg-orange-50 text-[#FF5C00] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Group Order
                </button>
                <button
                  onClick={handleClearCart}
                  className="h-11 px-4 rounded-xl border border-orange-100 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal Overlay */}
        {showInviteModal && currentGroupOrder && (
          <div className="fixed inset-0 bg-orange-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[48px] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-100 rounded-full blur-3xl" />
              
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-8 right-8 w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center hover:bg-orange-100 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-orange-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-200 rotate-12">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">Invite Friends</h3>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Copy and share the link</p>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                  <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-2 block">Your Code</span>
                  <p className="text-5xl font-black text-orange-600 tracking-widest uppercase leading-none">{currentGroupOrder.inviteCode}</p>
                </div>

                <div className="relative group">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/group-order/${currentGroupOrder.inviteCode}`}
                    className="w-full bg-gray-50 border-orange-100 border-2 rounded-2xl py-6 px-6 pr-20 text-xs font-black text-gray-400 focus:outline-none focus:border-orange-500 transition-all"
                  />
                  <button 
                    onClick={copyInviteLink}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center hover:bg-orange-700 active:scale-90 transition-all"
                  >
                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>

                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-full h-20 bg-gray-900 text-white rounded-[32px] font-black uppercase tracking-widest text-lg shadow-2xl active:scale-95 transition-all mt-4"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Syncing Overlay */}
        {isAnyLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[300] flex items-center justify-center flex-col gap-6 animate-in fade-in">
            <div className="w-16 h-16 border-8 border-orange-100 border-t-orange-600 rounded-full animate-spin shadow-2xl shadow-orange-100" />
            <p className="text-orange-600 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Cart...</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}