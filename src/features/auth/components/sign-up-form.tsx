"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import {
  TypographyH2,
  TypographyP,
  IconSize,
} from "@/components/ui/typography";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    try {
      // Tạo user mới - sử dụng apiClient và apiRoutes
      const { apiClient } = await import("@/lib/api/axios");
      const { apiRoutes } = await import("@/lib/api/routes");

      await apiClient.post<{ message: string }>(apiRoutes.auth.signUp, {
        name,
        email,
        password,
      });

      // Axios tự động throw error cho status >= 400, nên nếu đến đây thì đã thành công

      // Auto sign in sau khi đăng ký
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Đăng ký thành công nhưng đăng nhập thất bại");
        setIsLoading(false);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/admin/dashboard" });
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="col" gap={6} className={className} {...props}>
      <Card overflow="hidden" padding="0">
        <CardContent padding="none" grid="2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 lg:p-10">
            <FieldGroup>
              <Flex
                direction="col"
                align="center"
                gap={4}
                textAlign="center"
                className="mb-4"
              >
                <TypographyH2 className="text-2xl md:text-3xl font-bold text-secondary">
                  Đăng ký hệ thống
                </TypographyH2>

                <Flex direction="col" gap={1}>
                  <PointerHighlight>
                    <TypographyP className="text-xl md:text-2xl font-bold text-primary uppercase tracking-tight">
                      Hệ thống Kết nối Phụ huynh
                    </TypographyP>
                  </PointerHighlight>
                  <TypographyP className="text-xs md:text-sm font-medium text-muted-foreground italic">
                    &quot;Nắm bắt hành trình của con, an tâm tương lai vững
                    chắc&quot;
                  </TypographyP>
                </Flex>
              </Flex>
              {error && (
                <Flex rounded="lg" bg="destructive-text" padding="md">
                  <TypographyP>{error}</TypographyP>
                </Flex>
              )}
              <Field>
                <FieldLabel htmlFor="name" className="text-primary font-medium">
                  Họ và tên
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Họ và tên"
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="email"
                  className="text-primary font-medium"
                >
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="password"
                  className="text-primary font-medium"
                >
                  Mật khẩu
                </FieldLabel>
                <Flex position="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tạo mật khẩu"
                    required
                    disabled={isLoading}
                    paddingRight="10"
                    className="border-muted-foreground/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-absolute"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <IconSize size="sm">
                        <EyeOff className="text-muted-foreground" />
                      </IconSize>
                    ) : (
                      <IconSize size="sm">
                        <Eye className="text-muted-foreground" />
                      </IconSize>
                    )}
                  </Button>
                </Flex>
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="confirm-password"
                  className="text-primary font-medium"
                >
                  Xác nhận mật khẩu
                </FieldLabel>
                <Flex position="relative">
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Xác nhận mật khẩu của bạn"
                    required
                    disabled={isLoading}
                    paddingRight="10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-absolute"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <IconSize size="sm">
                        <EyeOff className="text-muted-foreground" />
                      </IconSize>
                    ) : (
                      <IconSize size="sm">
                        <Eye className="text-muted-foreground" />
                      </IconSize>
                    )}
                  </Button>
                </Flex>
              </Field>
              <Field>
                <Button
                  type="submit"
                  variant="destructive"
                  size="lg"
                  disabled={isLoading}
                >
                  <span className="text-base font-bold">
                    {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </span>
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>
              <Field>
                <Flex justify="center" fullWidth>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    fullWidth
                    className="border-secondary/30 hover:bg-secondary/10 gap-1"
                  >
                    <IconBrandGoogleFilled className="text-secondary text-base" />
                    <span className="text-secondary font-bold text-base">
                      Đăng ký bằng Google
                    </span>
                  </Button>
                </Flex>
              </Field>
              <FieldDescription
                textAlign="center"
                className="text-sm md:text-base"
              >
                Đã có tài khoản?{" "}
                <Link
                  href="/auth/sign-in"
                  prefetch={false}
                  className="font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Đăng nhập
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <Flex bg="muted" position="relative" display="hidden-md-flex">
            <Image
              src="https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg"
              alt="Hình ảnh"
              width={1000}
              height={1000}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.85]"
            />
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  );
}
