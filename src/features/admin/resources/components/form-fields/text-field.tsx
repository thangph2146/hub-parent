"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import type { ResourceFormField } from "../resource-form"

interface TextFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
}

export const TextField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
}: TextFieldProps<T>) => {
  const fieldValue = value ?? ""
  const isPassword = field.type === "password"
  const [showPassword, setShowPassword] = React.useState(false)
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <FieldContent>
      <Flex position="relative" fullWidth>
        <Input
          id={fieldId}
          name={fieldId}
          type={isPassword && !showPassword ? "password" : "text"}
          value={String(fieldValue)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled || isPending}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
          className={cn(
            error && "border-destructive",
            isPassword && "pr-10"
          )}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={field.disabled || isPending}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
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
        )}
      </Flex>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

