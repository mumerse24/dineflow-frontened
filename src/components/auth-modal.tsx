"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { loginUser, registerUser, loginAdmin, riderLogin } from "../store/thunks/authThunks"
import { clearError, setUser } from "../store/slices/authSlice"
import AuthAdmin from "../services/alogin"
import { toast } from "sonner"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup" | "forgot-password"
  onModeChange: (mode: "signin" | "signup" | "forgot-password") => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"customer" | "rider" | "admin">("customer")
  const [localError, setLocalError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
  })
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth)
  const riderLoading = useAppSelector((state) => state.rider.isLoading)
  const riderError = useAppSelector((state) => state.rider.error)

  const isAnyLoading = isLoading || riderLoading

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose()
      
      const targetPath = (location.state as any)?.from?.pathname || 
                        (user?.role === "admin" ? "/admin/dashboard" : 
                         user?.role === "rider" ? "/rider/dashboard" : "/")
      
      // Only navigate if we're not already there
      if (location.pathname !== targetPath) {
        setTimeout(() => {
          navigate(targetPath, { replace: true })
        }, 150) // Small delay for UX
      }
    }
  }, [isAuthenticated, isOpen, user?.role]) // Minimal dependencies to prevent re-execution loops

  // Reset form and errors when role or mode changes
  useEffect(() => {
    if (isOpen) {
      dispatch(clearError())
      setLocalError(null)
      
      // Allow overriding the default role if passed via location state
      const stateRole = (location.state as any)?.defaultRole
      if (stateRole && ["customer", "rider", "admin"].includes(stateRole)) {
        setSelectedRole(stateRole as "customer" | "rider" | "admin")
      }

      setFormData({
        email: "",
        password: "",
        name: "",
        phone: "",
        address: "",
      })
      setResetSent(false)
      setResetLoading(false)
    }
  }, [isOpen, mode, dispatch, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    try {
      if (mode === "signin") {
        if (selectedRole === "customer") {
          const result = await dispatch(loginUser({ email: formData.email, password: formData.password })).unwrap()
          if (result.user && result.user.role === "customer") {
            onClose()
            navigate("/")
            return
          } else {
            setLocalError("Role mismatch: This account is not a customer.")
            dispatch(setUser(null))
          }
        } 
        else if (selectedRole === "rider") {
          const result = await dispatch(riderLogin({ email: formData.email, password: formData.password })).unwrap()
          if (result.user?.role === "rider") {
            navigate("/rider/dashboard", { replace: true })
            onClose()
            return
          } else {
            setLocalError("Role mismatch: This account is not a rider.")
            dispatch(setUser(null))
          }
        } 
        else if (selectedRole === "admin") {
          const result = await dispatch(loginAdmin({ email: formData.email, password: formData.password })).unwrap()
          if (result.user?.role === "admin" || result.user?.role === "superadmin") {
            navigate("/admin/dashboard", { replace: true })
            onClose()
            return
          } else {
            setLocalError("Role mismatch: This account is not an admin.")
            dispatch(setUser(null))
          }
        }
        
        // Final safety: Clear all Redux errors if it was successful up to here
        dispatch(clearError())
      } else {
        // Only customers can sign up
        dispatch(
          registerUser({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: "customer",
          }),
        )
      }
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setResetLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      const data = await response.json()

      if (data.success) {
        setResetSent(true)
        toast.success("Success!", {
          description: "Password reset link has been sent to your email."
        })
      } else {
        setLocalError(data.message || "Failed to send reset link")
      }
    } catch (err: any) {
      setLocalError("Error: Could not connect to server.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} aria-labelledby={undefined} className="sm:max-w-md bg-background/95 backdrop-blur-sm border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {mode === "signin" ? "Welcome Back!" : mode === "signup" ? "Join FoodHub" : "Reset Password"}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              {mode === "signin" ? "Sign in to your account." : mode === "signup" ? "Create a new account." : "Request a password reset link."}
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {mode === "forgot-password" ? (
          <div className="space-y-6 mt-4">
            {resetSent ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground px-4">
                  We've sent a password reset link to <span className="font-semibold text-foreground">{formData.email}</span>.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    setResetSent(false)
                    onModeChange("signin")
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center px-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                {localError && (
                  <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {localError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11"
                >
                  {resetLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : "Send Reset Link"}
                </Button>

                <Button 
                  type="button"
                  variant="link" 
                  className="w-full text-muted-foreground hover:text-foreground text-sm"
                  onClick={() => onModeChange("signin")}
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Role Selection Tabs */}
          {mode === "signin" && (
            <div className="flex p-1 bg-muted rounded-lg items-center gap-1">
              {(["customer", "rider", "admin"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  name={`role-${role}`}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    selectedRole === role ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          )}

          {(error || riderError || localError) && (
            <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md animate-in fade-in slide-in-from-top-1">
              {error || riderError || localError}
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email webauthn"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Delivery Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your delivery address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="pl-10 bg-input/50 border-border focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isAnyLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-3 disabled:opacity-50 transition-all font-bold tracking-wide shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {isAnyLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Please wait...
              </div>
            ) : mode === "signin" ? (
              `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
            ) : (
              "Create Customer Account"
            )}
          </Button>

          {mode === "signin" && (
            <div className="text-center">
              <Button 
                variant="link" 
                className="text-amber-600 hover:text-amber-700 text-sm"
                onClick={() => onModeChange("forgot-password")}
                type="button"
              >
                Forgot your password?
              </Button>
            </div>
          )}

          <Separator className="my-6 opacity-50" />

          {selectedRole === "customer" && (
            <div className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
              <Button
                type="button"
                variant="link"
                onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
                className="text-amber-600 hover:text-amber-700 font-bold ml-1 p-0 h-auto"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </Button>
            </div>
          )}
          
          {selectedRole !== "customer" && mode === "signin" && (
            <div className="text-center text-xs text-muted-foreground italic">
              New {selectedRole}s must contact support to get an account.
            </div>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
