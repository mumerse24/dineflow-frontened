import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Clock, Shield, Heart, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-50 to-emerald-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            About <span className="text-amber-600">DineFlow</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-pretty">
            We're on a mission to connect food lovers with amazing restaurants, making delicious meals accessible to
            everyone, everywhere.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 text-pretty">
                FoodHub was founded with a simple belief: great food should be accessible to everyone. We partner with
                restaurants of all sizes, from local favorites to popular chains, to bring you the widest variety of
                cuisines at your fingertips.
              </p>
              <p className="text-lg text-gray-600 mb-8 text-pretty">
                Our platform empowers restaurants to reach more customers while giving food lovers the convenience of
                ordering from multiple restaurants in one place.
              </p>
              <Button className="bg-amber-600 hover:bg-amber-700">Join Our Community</Button>
            </div>
            <div className="relative">
              <img
                src="/team-of-diverse-people-working-together-in-modern-.png"
                alt="Our team"
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape our commitment to customers and restaurant partners.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community First</h3>
                <p className="text-gray-600 text-pretty">
                  We believe in supporting local restaurants and building stronger communities through food.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Speed & Reliability</h3>
                <p className="text-gray-600 text-pretty">
                  Fast delivery times and reliable service you can count on, every single time.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust & Safety</h3>
                <p className="text-gray-600 text-pretty">
                  Your safety and satisfaction are our top priorities in every interaction.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Passion for Food</h3>
                <p className="text-gray-600 text-pretty">
                  We're food lovers ourselves and understand the joy that great meals bring.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">DineFlow by the Numbers</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-amber-600 mb-2">10,000+</div>
              <div className="text-gray-600">Partner Restaurants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">1M+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Cities Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">25 min</div>
              <div className="text-gray-600">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  )
}
