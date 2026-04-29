"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { fetchRestaurants } from "../store/slices/restaurantSlice"
import { Star, Clock, Truck } from "lucide-react"

export function RestaurantGrid() {
  const [sortBy, setSortBy] = useState("featured")

  const dispatch = useAppDispatch()
  const { restaurants, isLoading, error, filters, pagination } = useAppSelector(
    (state) => state.restaurants
  )

  useEffect(() => {
    dispatch(fetchRestaurants({ page: 1, limit: 12 }))
  }, [dispatch])

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    const sortParams: any = { page: 1, limit: 12 }

    if (newSortBy === "rating") {
      sortParams.rating = 4.0
    }

    dispatch(fetchRestaurants(sortParams))
  }

  const handleLoadMore = () => {
    if (pagination?.page < pagination?.totalPages) {
      dispatch(
        fetchRestaurants({
          page: pagination.page + 1,
          limit: 12,
          ...filters,
        })
      )
    }
  }

  if (isLoading && restaurants.length === 0) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading restaurants...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => dispatch(fetchRestaurants({ page: 1, limit: 12 }))}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Sort Options */}
      {/* Restaurant Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card key={restaurant._id} className="group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative">
              <img
                src={restaurant.image || "/placeholder.svg"}
                alt={restaurant.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              {restaurant.status === "approved" && (
                <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Verified
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                {restaurant.rating.toFixed(1)}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-600 transition-colors">
                  {restaurant.name}
                </h3>
                <span className="text-sm text-gray-500 capitalize">{restaurant.cuisine}</span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{restaurant.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-1" />
                  <span className={restaurant.deliveryFee === 0 ? "text-emerald-600 font-medium" : ""}>
                    {restaurant.deliveryFee === 0 ? "Free" : `$${restaurant.deliveryFee.toFixed(2)}`} delivery
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>Min. order: ${restaurant.minimumOrder.toFixed(2)}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    restaurant.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {restaurant.isOpen ? "Open" : "Closed"}
                </span>
              </div>

              <Link to={`/restaurant/${restaurant._id}`}>
                <Button className="w-full bg-amber-600 hover:bg-amber-700" disabled={!restaurant.isOpen}>
                  {restaurant.isOpen ? "View Menu" : "Currently Closed"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {pagination?.page < pagination?.totalPages && (
        <div className="text-center mt-8">
          <Button variant="outline" className="px-8 bg-transparent" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More Restaurants"}
          </Button>
        </div>
      )}

    </div>
  )
}
