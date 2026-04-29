"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Store, CreditCard, FileText } from "lucide-react"
import { useState } from "react"

export default function RegisterRestaurantPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    cuisine: "",
    description: "",
    businessLicense: "",
    taxId: "",
    bankAccount: "",
    routingNumber: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Restaurant registration submitted:", formData)
    // Handle form submission
  }

  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-emerald-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Partner with <span className="text-amber-600">DineFlow</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-pretty">
            Join thousands of restaurants already growing their business with our platform. Reach more customers and
            increase your revenue.
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-amber-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Restaurant Details */}
            {currentStep === 1 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Store className="w-6 h-6 mr-2 text-amber-600" />
                    Restaurant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                      <Input
                        placeholder="Your Restaurant Name"
                        value={formData.restaurantName}
                        onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                      <Input
                        placeholder="Your Full Name"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange("ownerName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input
                        type="email"
                        placeholder="restaurant@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Address</label>
                    <Input
                      placeholder="123 Main St, City, State 12345"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        value={formData.cuisine}
                        onChange={(e) => handleInputChange("cuisine", e.target.value)}
                        required
                      >
                        <option value="">Select Cuisine</option>
                        <option value="italian">Italian</option>
                        <option value="chinese">Chinese</option>
                        <option value="indian">Indian</option>
                        <option value="mexican">Mexican</option>
                        <option value="american">American</option>
                        <option value="japanese">Japanese</option>
                        <option value="thai">Thai</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your restaurant..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>
                  <Button type="button" onClick={nextStep} className="w-full bg-amber-600 hover:bg-amber-700">
                    Continue to Business Information
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Business Information */}
            {currentStep === 2 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <FileText className="w-6 h-6 mr-2 text-amber-600" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business License Number</label>
                    <Input
                      placeholder="Enter your business license number"
                      value={formData.businessLicense}
                      onChange={(e) => handleInputChange("businessLicense", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (EIN)</label>
                    <Input
                      placeholder="XX-XXXXXXX"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange("taxId", e.target.value)}
                      required
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2">Required Documents</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Business License</li>
                      <li>• Food Service License</li>
                      <li>• Certificate of Insurance</li>
                      <li>• Menu with Prices</li>
                    </ul>
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 bg-transparent">
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="flex-1 bg-amber-600 hover:bg-amber-700">
                      Continue to Payment Setup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Information */}
            {currentStep === 3 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <CreditCard className="w-6 h-6 mr-2 text-amber-600" />
                    Payment Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                    <Input
                      placeholder="Enter your bank account number"
                      value={formData.bankAccount}
                      onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                    <Input
                      placeholder="Enter your routing number"
                      value={formData.routingNumber}
                      onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 mb-2">Commission Structure</h4>
                    <div className="text-sm text-emerald-700 space-y-2">
                      <div className="flex justify-between">
                        <span>Commission Rate:</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Schedule:</span>
                        <span>Weekly</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Setup Fee:</span>
                        <span className="font-semibold">FREE</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 bg-transparent">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Complete Registration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </section>
    </main>
  )
}
