import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Clipboard, MapPin, Phone, Bike, Package, CheckCircle2, MessageSquare, Info } from "lucide-react"
import { toast } from "sonner"

export default function OrderConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    orderId = "",
    orderNumber = `ORD-${Date.now().toString().slice(-8)}`,
    customerName = "Customer",
    totalAmount = "0.00",
    items = [],
    totals = { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 }
  } = location.state || {}

  // Calculate service fee (example 5% or fixed)
  const serviceFee = items.length > 0 ? 130 : 0
  const taxRate = 0.08
  const taxAmount = (totals.subtotal || 0) * taxRate

  const orderDate = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderNumber)
    toast.success("Order ID copied to clipboard!")
  }

  const steps = [
    { label: "Placed", icon: Check, active: true },
    { label: "Confirmed", icon: Check, active: false },
    { label: "On the way", icon: Bike, active: false },
    { label: "Delivered", icon: Package, active: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 md:py-24">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-orange-500 p-8 text-white relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Order Receipt</h1>
                <p className="text-orange-100 text-sm mt-1 opacity-90">Delicious Food Restaurant - {orderDate}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                <span className="text-xs font-bold uppercase tracking-wider">Placed</span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="mt-10 flex items-center justify-between relative px-2">
              {/* Connecting Line */}
              <div className="absolute top-5 left-10 right-10 h-[2px] bg-white/20 -z-0" />
              
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step.active ? 'bg-white text-orange-500 border-white shadow-lg' : 'bg-transparent text-white/40 border-white/20'}`}>
                    <step.icon className={`w-5 h-5 ${step.active ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${step.active ? 'text-white' : 'text-white/40'}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Phone</p>
                <p className="text-sm font-black text-gray-900">031175797272</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Order type</p>
                <p className="text-sm font-black text-gray-900">Delivery</p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                <p className="text-xs font-bold text-gray-800 leading-relaxed italic">
                  Malhu Khokhar Gujrat Street No 1<br />
                  Gujrat, Punjab
                </p>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Ordered Items */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Ordered Items</p>
              {items.length > 0 ? (
                items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] font-black border border-orange-100">
                        {item.quantity}x
                      </div>
                      <p className="text-sm font-bold text-gray-800">{item.menuItem.name}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">Rs {item.menuItem.price * item.quantity}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 italic">No items found</p>
                </div>
              )}
            </div>

            <Separator className="bg-gray-100" />

            {/* Pricing Breakdown */}
            <div className="space-y-3 px-1">
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Subtotal</span>
                <span>Rs {totals.subtotal || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Delivery fee</span>
                <span>Rs {totals.deliveryFee || 150}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Service fee</span>
                <span>Rs {serviceFee}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Tax (8%)</span>
                <span>Rs {Math.round(taxAmount)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-bold">
                  <span>Discount</span>
                  <span>- Rs {totals.discount}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between items-end">
                <span className="text-sm font-black text-gray-800">Total</span>
                <span className="text-2xl font-black text-orange-500">Rs {Math.round(Number(totalAmount)) + serviceFee}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Package className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-gray-700">Cash on delivery</p>
              </div>
              <div className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Payment pending
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={() => navigate('/order/track/' + (orderId || orderNumber))}
                className="rounded-2xl h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                Track order
              </Button>
              <Button 
                variant="outline"
                className="rounded-2xl h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 font-black text-xs uppercase tracking-widest shadow-sm"
              >
                Need help?
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
               <p className="text-[10px] font-bold text-gray-400 italic">Thank you for ordering with us!</p>
               <div className="flex items-center justify-center gap-2 mt-2 group cursor-pointer" onClick={copyToClipboard}>
                 <p className="text-[9px] font-mono font-bold text-gray-300 tracking-tighter uppercase">#{orderNumber} - Generated {orderDate}</p>
                 <Clipboard className="w-3 h-3 text-gray-200 group-hover:text-orange-400 transition-colors" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-[1px] w-full ${className}`} />
}