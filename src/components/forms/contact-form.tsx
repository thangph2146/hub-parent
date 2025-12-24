"use client";

import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { TypographySpanSmall, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  User,
  MessageSquare,
  FileText,
  Send,
  Loader2,
  Phone,
} from "lucide-react";

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
  apiUrl?: string;
}

export function ContactForm({ onSubmit, className, apiUrl = "/api/contact" }: ContactFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmitForm = async (data: ContactFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default behavior - call API
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone?.trim() || null,
            subject: data.subject.trim(),
            content: data.message.trim(),
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Không thể gửi tin nhắn");
        }
      }

      toast({
        variant: "success",
        title: "Gửi thành công!",
        description:
          "Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi sớm nhất có thể.",
      });

      // Reset form
      reset();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Không thể gửi tin nhắn. Vui lòng thử lại sau.";
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: message,
      });
    }
  };

  return (
    <Card className={className}>
      <CardContent>
        <form onSubmit={handleFormSubmit(onSubmitForm)}>
          <Flex direction="col" gap={6}>
            <FieldGroup>
              <Flex direction="col" gap={6}>
                <Grid cols={2} gap={6}>
                  <Field data-invalid={Boolean(errors.name)}>
                    <FieldLabel htmlFor="name">
                      <Flex align="center" gap={2}>
                        <IconSize size="sm">
                          <User />
                        </IconSize>
                        <TypographySpanSmall>Họ tên <span className="text-destructive">*</span></TypographySpanSmall>
                      </Flex>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nhập họ tên của bạn"
                        aria-invalid={Boolean(errors.name)}
                        className={errors.name ? "border-destructive" : ""}
                        {...register("name", {
                          required: "Họ tên là bắt buộc",
                          minLength: {
                            value: 2,
                            message: "Họ tên phải có ít nhất 2 ký tự",
                          },
                          maxLength: {
                            value: 100,
                            message: "Họ tên không vượt quá 100 ký tự",
                          },
                          validate: (value) => {
                            const trimmed = value.trim();
                            if (!trimmed) return "Họ tên là bắt buộc";
                            return true;
                          },
                        })}
                      />
                      {errors.name && <FieldError>{errors.name.message}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={Boolean(errors.email)}>
                    <FieldLabel htmlFor="email">
                      <Flex align="center" gap={2}>
                        <IconSize size="sm">
                          <Mail />
                        </IconSize>
                        <TypographySpanSmall>Email <span className="text-destructive">*</span></TypographySpanSmall>
                      </Flex>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Nhập địa chỉ email của bạn"
                        aria-invalid={Boolean(errors.email)}
                        className={errors.email ? "border-destructive" : ""}
                        {...register("email", {
                          required: "Email là bắt buộc",
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Email không hợp lệ",
                          },
                          maxLength: {
                            value: 255,
                            message: "Email không vượt quá 255 ký tự",
                          },
                          validate: (value) => {
                            const trimmed = value.trim();
                            if (!trimmed) return "Email là bắt buộc";
                            return true;
                          },
                        })}
                      />
                      {errors.email && <FieldError>{errors.email.message}</FieldError>}
                    </FieldContent>
                  </Field>
                </Grid>

                <Grid cols={2} gap={6}>
                  <Field data-invalid={Boolean(errors.phone)}>
                    <FieldLabel htmlFor="phone">
                      <Flex align="center" gap={2}>
                        <IconSize size="sm">
                          <Phone />
                        </IconSize>
                        <TypographySpanSmall>Số điện thoại</TypographySpanSmall>
                      </Flex>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Nhập số điện thoại (không bắt buộc)"
                        aria-invalid={Boolean(errors.phone)}
                        className={errors.phone ? "border-destructive" : ""}
                        {...register("phone", {
                          maxLength: {
                            value: 20,
                            message: "Số điện thoại không vượt quá 20 ký tự",
                          },
                          pattern: {
                            value: /^[0-9+\-\s()]*$/,
                            message: "Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc",
                          },
                        })}
                      />
                      {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={Boolean(errors.subject)}>
                    <FieldLabel htmlFor="subject">
                      <Flex align="center" gap={2}>
                        <IconSize size="sm">
                          <FileText />
                        </IconSize>
                        <TypographySpanSmall>Tiêu đề <span className="text-destructive">*</span></TypographySpanSmall>
                      </Flex>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Nhập tiêu đề tin nhắn"
                        aria-invalid={Boolean(errors.subject)}
                        className={errors.subject ? "border-destructive" : ""}
                        {...register("subject", {
                          required: "Tiêu đề là bắt buộc",
                          minLength: {
                            value: 3,
                            message: "Tiêu đề phải có ít nhất 3 ký tự",
                          },
                          maxLength: {
                            value: 200,
                            message: "Tiêu đề không vượt quá 200 ký tự",
                          },
                          validate: (value) => {
                            const trimmed = value.trim();
                            if (!trimmed) return "Tiêu đề là bắt buộc";
                            return true;
                          },
                        })}
                      />
                      {errors.subject && <FieldError>{errors.subject.message}</FieldError>}
                    </FieldContent>
                  </Field>
                </Grid>

                <Field data-invalid={Boolean(errors.message)}>
                  <FieldLabel htmlFor="message">
                    <Flex align="center" gap={2}>
                      <IconSize size="sm">
                        <MessageSquare />
                      </IconSize>
                      <TypographySpanSmall>Nội dung tin nhắn <span className="text-destructive">*</span></TypographySpanSmall>
                    </Flex>
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="message"
                      placeholder="Mô tả chi tiết vấn đề cần được giải quyết..."
                      rows={5}
                      className={cn(
                        "min-h-[100px] sm:min-h-[120px]",
                        errors.message ? "border-destructive" : ""
                      )}
                      aria-invalid={Boolean(errors.message)}
                      {...register("message", {
                        required: "Nội dung tin nhắn là bắt buộc",
                        minLength: {
                          value: 10,
                          message: "Nội dung tin nhắn phải có ít nhất 10 ký tự",
                        },
                        maxLength: {
                          value: 5000,
                          message: "Nội dung tin nhắn không vượt quá 5000 ký tự",
                        },
                        validate: (value) => {
                          const trimmed = value.trim();
                          if (!trimmed) return "Nội dung tin nhắn là bắt buộc";
                          return true;
                        },
                      })}
                    />
                    {errors.message && <FieldError>{errors.message.message}</FieldError>}
                  </FieldContent>
                </Field>
              </Flex>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Flex align="center" gap={2}>
                {isSubmitting ? (
                  <>
                    <IconSize size="sm">
                      <Loader2 className="animate-spin" />
                    </IconSize>
                    <TypographySpanSmall>Đang gửi...</TypographySpanSmall>
                  </>
                ) : (
                  <>
                    <IconSize size="sm">
                      <Send />
                    </IconSize>
                    <TypographySpanSmall>Gửi tin nhắn</TypographySpanSmall>
                  </>
                )}
              </Flex>
            </Button>
          </Flex>
        </form>
      </CardContent>
    </Card>
  );
}
