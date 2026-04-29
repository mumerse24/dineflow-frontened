export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Food Enthusiast",
      content:
        "Amazing variety of restaurants! I've discovered so many new cuisines through this platform. The delivery is always fast and the food arrives hot.",
      rating: 5,
      avatar: "/diverse-woman-smiling.png",
    },
    {
      id: 2,
      name: "Mike Chen",
      role: "Busy Professional",
      content:
        "Perfect for my hectic schedule. I can order from my favorite restaurants with just a few clicks. The app is intuitive and the customer service is excellent.",
      rating: 5,
      avatar: "/professional-man.png",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Family Mom",
      content:
        "Great for family dinners! The kids love the variety and I appreciate the healthy options. The group ordering feature makes it easy to satisfy everyone.",
      rating: 5,
      avatar: "/woman-mother.png",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-balance">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Join thousands of satisfied customers who trust us for their food delivery needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-pretty leading-relaxed">"{testimonial.content}"</p>
              <div className="flex items-center">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
