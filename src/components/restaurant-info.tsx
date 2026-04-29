"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const restaurants = [
  {
    id: 1,
    name: "Bella Italia",
    cuisine: "Italian",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.99",
    image: "/italian-restaurant-pasta-pizza.png",
    featured: true,
    tags: ["Popular", "Fast Delivery"],
    description:
      "Authentic Italian cuisine with fresh pasta, wood-fired pizzas, and traditional recipes passed down through generations.",
    address: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
    hours: "11:00 AM - 10:00 PM",
    minimumOrder: "$15.00",
    reviews: 1247,
  },
  {
    id: 2,
    name: "Spice Garden",
    cuisine: "Indian",
    rating: 4.6,
    deliveryTime: "30-40 min",
    deliveryFee: "Free",
    image: "/indian-restaurant-curry-spices.png",
    featured: false,
    tags: ["Vegetarian Options", "Spicy"],
    description:
      "Traditional Indian flavors with aromatic spices, fresh ingredients, and authentic recipes from various regions of India.",
    address: "456 Oak Avenue, Midtown",
    phone: "(555) 234-5678",
    hours: "12:00 PM - 11:00 PM",
    minimumOrder: "$20.00",
    reviews: 892,
  },
  {
    id: 3,
    name: "Tokyo Sushi",
    cuisine: "Japanese",
    rating: 4.9,
    deliveryTime: "20-30 min",
    deliveryFee: "$3.99",
    image: "/japanese-sushi-restaurant.png",
    featured: true,
    tags: ["Fresh", "Premium"],
    description:
      "Premium sushi and Japanese cuisine made with the freshest fish and traditional techniques by experienced sushi chefs.",
    address: "789 Pine Street, Uptown",
    phone: "(555) 345-6789",
    hours: "5:00 PM - 12:00 AM",
    minimumOrder: "$25.00",
    reviews: 2156,
  },
  {
    id: 4,
    name: "Burger Palace",
    cuisine: "American",
    rating: 4.4,
    deliveryTime: "15-25 min",
    deliveryFee: "$1.99",
    image: "/american-burger-restaurant.png",
    featured: false,
    tags: ["Fast Food", "Comfort Food"],
    description:
      "Juicy burgers, crispy fries, and classic American comfort food made with quality ingredients and served fast.",
    address: "321 Elm Street, Westside",
    phone: "(555) 456-7890",
    hours: "10:00 AM - 11:00 PM",
    minimumOrder: "$12.00",
    reviews: 743,
  },
  {
    id: 5,
    name: "Green Bowl",
    cuisine: "Healthy",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: "Free",
    image: "/healthy-salad-bowl-restaurant.png",
    featured: false,
    tags: ["Healthy", "Vegan Options"],
    description:
      "Fresh, healthy meals with organic ingredients, superfoods, and nutritious options for every dietary preference.",
    address: "654 Maple Drive, Eastside",
    phone: "(555) 567-8901",
    hours: "8:00 AM - 9:00 PM",
    minimumOrder: "$18.00",
    reviews: 1089,
  },
  {
    id: 6,
    name: "Dragon Palace",
    cuisine: "Chinese",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.49",
    image: "/chinese-dim-sum.png",
    featured: false,
    tags: ["Family Style", "Authentic"],
    description:
      "Authentic Chinese cuisine with traditional dim sum, stir-fries, and family-style dishes perfect for sharing.",
    address: "987 Cedar Lane, Southside",
    phone: "(555) 678-9012",
    hours: "11:30 AM - 10:30 PM",
    minimumOrder: "$22.00",
    reviews: 567,
  },
]

interface RestaurantInfoProps {
  restaurantId?: string
}

export function RestaurantInfo({ restaurantId }: RestaurantInfoProps) {
  const restaurant = restaurants.find((r) => r.id === Number(restaurantId))
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
            <p className="text-gray-600">The restaurant you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Restaurant Image */}
        <div className="lg:col-span-2">
          <div className="relative">
            <img
              src={restaurant.image || "/placeholder.svg"}
              alt={restaurant.name}
              className="w-full h-64 md:h-80 object-cover rounded-lg"
            />
            {restaurant.featured && (
              <Badge className="absolute top-4 left-4 bg-amber-500 hover:bg-amber-600">Featured</Badge>
            )}
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{restaurant.rating}</span>
                <span className="text-gray-500 ml-1">({restaurant.reviews})</span>
              </div>
            </div>
            <p className="text-lg text-gray-600 mb-4">{restaurant.cuisine} Cuisine</p>
            <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Delivery Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Time:</span>
                  <span className="font-medium">{restaurant.deliveryTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className={`font-medium ${restaurant.deliveryFee === "Free" ? "text-emerald-600" : ""}`}>
                    {restaurant.deliveryFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Order:</span>
                  <span className="font-medium">{restaurant.minimumOrder}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contact & Hours</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="font-medium">{restaurant.address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{restaurant.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours:</span>
                  <span className="font-medium">{restaurant.hours}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-amber-600 hover:bg-amber-700">View Menu & Order</Button>
            <Button variant="outline" className="w-full bg-transparent">
              Add to Favorites
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
