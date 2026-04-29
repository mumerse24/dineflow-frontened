import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ShoppingBag, ArrowRight, Home, Smartphone, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import confetti from 'canvas-confetti'

export default function OrderSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    orderId = "",
    orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    totalAmount = 0,
    customerName = "Valued Customer"
  } = location.state || {}

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2 
        }}
        className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-10 border-8 border-orange-100"
      >
        <Check className="w-16 h-16 text-white stroke-[4px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 uppercase">
          Order Placed <span className="text-orange-500">Successfully!</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium max-w-md mx-auto mb-10">
          Thank you for choosing FoodExpress, <span className="text-gray-900 font-bold">{customerName}</span>. 
          Your delicious meal is being prepared with care.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
          <Card className="border-0 bg-gray-50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
              <p className="text-xl font-black text-gray-900">#{orderNumber}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-orange-50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <Star className="w-6 h-6 fill-orange-500" />
              </div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Loyalty Points</p>
              <p className="text-xl font-black text-orange-600">+{Math.floor(totalAmount / 100)} Pts</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
                size="lg"
                onClick={() => navigate(`/order/track/${orderId || orderNumber}`)}
                className="h-16 px-10 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 group w-full sm:w-auto"
            >
                Track My Order
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
                className="h-16 px-10 rounded-2xl border-2 border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 font-black text-sm uppercase tracking-[0.2em] w-full sm:w-auto"
            >
                <Home className="mr-3 w-5 h-5" />
                Back to Home
            </Button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default select-none animate-pulse">
            <Smartphone className="w-10 h-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Real-time Support Active</p>
        </div>
      </motion.div>
    </div>
  )
}
