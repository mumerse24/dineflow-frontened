import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="bg-sidebar border-t border-sidebar-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">DineFlow</span>
            </div>
            <p className="text-muted-foreground text-pretty">
              Delivering delicious food from your favorite restaurants to your doorstep, fast and fresh.
            </p>
            <div className="flex items-center space-x-4">
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-sidebar-primary cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-sidebar-primary cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-sidebar-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sidebar-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Menu
                </Link>
              </li>
              <li>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sidebar-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-sidebar-primary transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sidebar-foreground">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm">+92-3110797273</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm break-all">support@DineFlow.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-sidebar-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm">123 Food Street, City, State 12345</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">© 2024 DineFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
