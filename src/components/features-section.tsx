import { Card, CardContent } from "@/components/ui/card"
import { Clock, Shield, Truck, Star } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "Get your food delivered in 30 minutes or less, guaranteed fresh and hot.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Your payments are protected with bank-level security and encryption.",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Enjoy free delivery on orders over $25. No hidden fees or charges.",
  },
  {
    icon: Star,
    title: "Quality Food",
    description: "Partner restaurants are carefully selected for quality and taste.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Why Choose FoodHub?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're committed to providing the best food delivery experience with unmatched speed, quality, and
            convenience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border text-center hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
