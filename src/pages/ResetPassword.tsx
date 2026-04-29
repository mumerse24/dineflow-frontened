import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        toast.success("Success!", {
          description: "Your password has been reset successfully."
        })
      } else {
        setError(data.message || "Something went wrong. The link may have expired.")
      }
    } catch (err) {
      setError("Failed to connect to the server.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md">
          {isSuccess ? (
            <Card className="border-none shadow-2xl animate-in fade-in zoom-in duration-300">
              <CardContent className="pt-10 pb-10 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
                  <p className="text-muted-foreground">Your password has been updated. You can now sign in with your new credentials.</p>
                </div>
                <Button 
                  onClick={() => navigate("/")} 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 h-12 text-lg font-bold"
                >
                  Go to Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-2xl overflow-hidden">
               <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardContent className="pt-8 pb-8 px-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
                  <p className="text-muted-foreground text-sm mt-2">Enter a strong password to secure your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-gray-50/50"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-11 bg-gray-50/50"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 h-12 text-lg font-bold shadow-lg shadow-orange-500/20"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         Updating...
                      </div>
                    ) : "Update Password"}
                  </Button>

                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full flex items-center justify-center gap-2 text-muted-foreground"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft size={16} />
                    Back to Home
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
