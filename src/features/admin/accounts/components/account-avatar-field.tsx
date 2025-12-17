"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, X } from "lucide-react"
import { getUserInitials } from "@/features/admin/resources/utils"
import { cn } from "@/lib/utils"

interface AccountAvatarFieldProps {
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
}

export const AccountAvatarField = ({
  value,
  onChange,
  placeholder = "https://example.com/avatar.jpg",
}: AccountAvatarFieldProps) => {
  const avatarUrl = typeof value === "string" ? value : ""
  const hasAvatar = avatarUrl && avatarUrl.trim() !== ""
  const [imageError, setImageError] = React.useState(false)
  const [name, setName] = React.useState("")

  // Get name from form input when it changes
  React.useEffect(() => {
    const updateName = () => {
      const nameInput = document.querySelector<HTMLInputElement>('input[name="name"]')
      if (nameInput) {
        setName(nameInput.value || "")
      }
    }
    updateName()
    const interval = setInterval(updateName, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Avatar className="relative h-28 w-28 border-4 border-background shadow-lg ring-2 ring-primary/10">
              <AvatarImage
                src={hasAvatar && !imageError ? avatarUrl : undefined}
                alt={name || "Avatar"}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground">
                {getUserInitials(name, "")}
              </AvatarFallback>
            </Avatar>
            {hasAvatar && !imageError && (
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 border-[3px] border-background flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={avatarUrl}
                onChange={(e) => {
                  onChange(e.target.value)
                  setImageError(false)
                }}
                placeholder={placeholder}
                className={cn("w-full")}
              />
              {hasAvatar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange("")
                    setImageError(false)
                  }}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Xóa ảnh đại diện
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Nhập URL của ảnh đại diện hoặc để trống để sử dụng chữ cái đầu
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

