import type { Metadata } from "next"
import { appConfig } from "@/lib/config"
import { CheckoutForm } from "@/features/public/checkout/components"

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Thanh toán đơn hàng - Trường Đại học Ngân hàng TP.Hồ Chí Minh",
  openGraph: {
    ...appConfig.openGraph,
    title: "Thanh toán - Trường Đại học Ngân hàng TP.HCM",
    description: "Thanh toán đơn hàng - Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    siteName: "Trường Đại học Ngân hàng TP.HCM",
  },
  twitter: {
    ...appConfig.twitter,
    title: "Thanh toán - Trường Đại học Ngân hàng TP.HCM",
    description: "Thanh toán đơn hàng - Trường Đại học Ngân hàng TP.Hồ Chí Minh",
  },
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Thanh toán</h1>
      <CheckoutForm />
    </div>
  )
}

