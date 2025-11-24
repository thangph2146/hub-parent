import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

/**
 * Forgot Password Page Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với root layout
 * - Title sử dụng template từ root: "Quên mật khẩu | CMS"
 */
export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Đặt lại mật khẩu của bạn",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
