# Providers Structure

## Cấu trúc Providers

Thư mục `providers/` chứa tất cả các React Context Providers được sử dụng trong ứng dụng.

### Tổ chức Files

```
providers/
├── index.tsx              # Main export - Root Providers component
├── theme-provider.tsx      # Dark mode support (next-themes)
├── session-provider.tsx    # NextAuth.js authentication
├── query-provider.tsx      # TanStack Query data fetching
├── loading-fallback.tsx    # Suspense fallback component
└── README.md              # Documentation
```

## Providers Hierarchy

Thứ tự providers quan trọng cho đúng functionality:

```tsx
<ThemeProvider>              // Ngoài cùng - cần có sẵn cho tất cả components
  <Suspense>                 // Wrap các providers có thể async
    <SessionProvider>        // Authentication state
      <QueryProvider>        // Data fetching & caching
        {children}
      </QueryProvider>
    </SessionProvider>
  </Suspense>
</ThemeProvider>
```

## Chi tiết từng Provider

### 1. ThemeProvider (`theme-provider.tsx`)
- **Mục đích**: Dark mode support
- **Library**: `next-themes`
- **Config**: 
  - `attribute="class"` - Sử dụng class để toggle
  - `defaultTheme="system"` - Mặc định theo system
  - `enableSystem` - Detect system preference
  - `disableTransitionOnChange` - Tắt transition khi đổi theme

### 2. SessionProvider (`session-provider.tsx`)
- **Mục đích**: Authentication state management
- **Library**: `next-auth/react`
- **Cung cấp**: `useSession()` hook cho toàn bộ app

### 3. QueryProvider (`query-provider.tsx`)
- **Mục đích**: Data fetching, caching, state management
- **Library**: `@tanstack/react-query`
- **Config**:
  - `staleTime: 60s` - Data fresh trong 1 phút
  - `refetchOnWindowFocus: false` - Không refetch khi focus
  - `retry: 1` - Retry 1 lần khi failed
- **Devtools**: Chỉ hiển thị trong development mode

### 4. LoadingFallback (`loading-fallback.tsx`)
- **Mục đích**: Hiển thị loading state khi providers đang khởi tạo
- **Sử dụng**: Làm `fallback` cho Suspense boundary

## Cách sử dụng

### Import và sử dụng trong Layout

```tsx
import { Providers } from "@/components/providers"

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Import từng provider riêng lẻ (nếu cần)

```tsx
import { ThemeProvider } from "@/components/providers/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { QueryProvider } from "@/components/providers/query-provider"
```

## Thêm Provider mới

1. Tạo file mới trong `providers/` folder
2. Export provider component
3. Import và thêm vào `providers/index.tsx` theo đúng thứ tự
4. Update documentation này

### Ví dụ:

```tsx
// providers/custom-provider.tsx
"use client"

import { CustomProvider as LibCustomProvider } from "some-library"

export function CustomProvider({ children }) {
  return <LibCustomProvider>{children}</LibCustomProvider>
}
```

```tsx
// providers/index.tsx
import { CustomProvider } from "./custom-provider"

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <CustomProvider>  {/* Thêm vào đây */}
        <Suspense fallback={<LoadingFallback />}>
          {/* ... */}
        </Suspense>
      </CustomProvider>
    </ThemeProvider>
  )
}
```

## Best Practices

1. **Thứ tự providers**: ThemeProvider luôn ngoài cùng
2. **Suspense boundary**: Wrap các providers có thể async
3. **Type safety**: Sử dụng TypeScript cho tất cả props
4. **Documentation**: Thêm comment giải thích mục đích và config
5. **Separation of concerns**: Mỗi provider trong file riêng
6. **Backward compatibility**: Re-export nếu cần maintain API cũ

## Troubleshooting

### Hydration warning
- Đảm bảo `<html>` có `suppressHydrationWarning`
- ThemeProvider phải wrap toàn bộ app

### Provider không hoạt động
- Kiểm tra thứ tự providers
- Đảm bảo component sử dụng provider nằm trong Providers tree
- Check console logs cho errors

### Type errors
- Đảm bảo đã import đúng types
- Check TypeScript config

