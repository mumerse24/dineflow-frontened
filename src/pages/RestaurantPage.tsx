"use client"

import { useParams } from "react-router-dom"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RestaurantInfo } from "@/components/restaurant-info"

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        <RestaurantInfo restaurantId={id} />
      </main>
      <Footer />
    </div>
  )
}
