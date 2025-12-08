import { CheckoutForm } from "@/features/public/checkout/components"

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Thanh toán</h1>
      <CheckoutForm />
    </div>
  )
}

