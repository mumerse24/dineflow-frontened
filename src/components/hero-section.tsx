import { Button } from "@/components/ui/button"
import { Clock, Star, Truck } from "lucide-react"
import { Link } from "react-router-dom"

export function HeroSection() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground text-balance">
                Delicious Food
                <span className="text-primary"> Delivered Fast</span>
              </h1>
              <p className="text-lg text-muted-foreground text-pretty max-w-lg">
                Order from your favorite restaurants and get fresh, hot meals delivered to your doorstep in 30 minutes
                or less.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">30 min delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">4.8 rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Free delivery</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                Order Now
              </Button>
              <Link to="/menu">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  View Menu
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-card">
              <img
                src="/delicious-food-delivery-hero-image-with-various-di.png"
                alt="Delicious food delivery"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Fast Delivery</p>
                  <p className="text-sm text-muted-foreground">In 30 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
