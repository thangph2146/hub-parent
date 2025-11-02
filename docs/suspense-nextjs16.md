# Suspense trong Next.js 16 - Hướng dẫn sử dụng

## Mục lục
1. [Suspense là gì?](#suspense-là-gì)
2. [Tại sao cần Suspense trong Next.js 16?](#tại-sao-cần-suspense-trong-nextjs-16)
3. [Khi nào cần dùng Suspense?](#khi-nào-cần-dùng-suspense)
4. [Cách sử dụng Suspense](#cách-sử-dụng-suspense)
5. [Best Practices](#best-practices)
6. [Ví dụ thực tế trong project](#ví-dụ-thực-tế-trong-project)

---

## Suspense là gì?

**Suspense** là một React component cho phép:

- Hiển thị **fallback UI** (loading state) trong khi component con đang thực hiện async operations
- Xử lý **streaming rendering** - render từng phần khi data sẵn sàng
- **Selective hydration** - React ưu tiên hydrate phần nào người dùng tương tác trước
- Tách biệt logic loading khỏi component logic

### Cú pháp cơ bản:

```tsx
<Suspense fallback={<LoadingComponent />}>
  <AsyncComponent />
</Suspense>
```

---

## Tại sao cần Suspense trong Next.js 16?

### 1. **Server Components (async by default)**

Next.js 16 App Router mặc định sử dụng Server Components, có thể là `async` và dùng `await` trực tiếp:

```tsx
// Server Component có thể async
export default async function Page() {
  const data = await fetchData() // Cần Suspense để xử lý loading
  return <div>{data}</div>
}
```

### 2. **Streaming SSR (React Server Components)**

Next.js 16 hỗ trợ **streaming** - server có thể gửi HTML từng phần khi data sẵn sàng:

```
┌─────────────────────────────────────┐
│ Server: Render page                 │
├─────────────────────────────────────┤
│ ✅ Header (immediate)               │
│ ⏳ Content (loading...)              │
│ ✅ Footer (immediate)               │
└─────────────────────────────────────┘
```

Suspense boundary giúp chia nhỏ page thành các phần và stream từng phần.

### 3. **Cải thiện UX**

- **Tránh white screen** - Hiển thị loading ở phần cần thiết
- **Progressive loading** - Phần nào xong hiển thị trước
- **Không block toàn bộ UI** - Chỉ phần async bị suspend

### 4. **Selective Hydration**

React ưu tiên hydrate phần người dùng tương tác trước, không phải chờ toàn bộ page.

---

## Khi nào cần dùng Suspense?

### ✅ **CẦN dùng Suspense khi:**

1. **Async Server Components**
   ```tsx
   // app/posts/page.tsx
   export default async function PostsPage() {
     const posts = await prisma.post.findMany() // Async!
     return <PostsList posts={posts} />
   }
   ```

2. **Client Components với async providers**
   ```tsx
   <Suspense fallback={<Loading />}>
     <SessionProvider>  // Có thể init chậm
       <QueryProvider>
         {children}
       </QueryProvider>
     </SessionProvider>
   </Suspense>
   ```

3. **Components fetch data từ API**
   ```tsx
   async function DataComponent() {
     const res = await fetch('/api/data')
     const data = await res.json()
     return <div>{data}</div>
   }
   
   <Suspense fallback={<Skeleton />}>
     <DataComponent />
   </Suspense>
   ```

4. **Sử dụng Dynamic APIs (cookies, headers, searchParams)**
   ```tsx
   async function UserComponent() {
     const session = (await cookies()).get('session')?.value
     return <div>{session}</div>
   }
   ```

5. **Sử dụng `loading.tsx` file** (Next.js tự động wrap với Suspense)

### ❌ **KHÔNG CẦN Suspense khi:**

1. **Sync components thông thường**
   ```tsx
   // ✅ Không cần Suspense
   export default function Page() {
     return <div>Hello World</div>
   }
   ```

2. **Client Components không async**
   ```tsx
   // ✅ Không cần Suspense
   "use client"
   export function Button() {
     return <button>Click me</button>
   }
   ```

3. **API Routes** (đó là server functions, không phải components)
   ```tsx
   // ✅ Không cần Suspense
   export async function GET() {
     return Response.json({ data: "..." })
   }
   ```

4. **Components chỉ render UI tĩnh**

---

## Cách sử dụng Suspense

### 1. **Suspense cơ bản**

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Welcome</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <AsyncComponent />
      </Suspense>
    </div>
  )
}
```

### 2. **Nhiều Suspense boundaries**

Bạn có thể có nhiều Suspense boundaries trong một page:

```tsx
export default function Dashboard() {
  return (
    <section>
      {/* Header hiển thị ngay */}
      <header>
        <h1>Dashboard</h1>
      </header>
      
      {/* Mỗi phần độc lập với loading riêng */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostFeed />
      </Suspense>
      
      <Suspense fallback={<WeatherSkeleton />}>
        <Weather />
      </Suspense>
      
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
    </section>
  )
}
```

**Lợi ích:**
- Mỗi phần load độc lập
- Phần nào xong hiển thị trước
- UX tốt hơn - không phải chờ tất cả

### 3. **Sử dụng `loading.tsx` file (Automatic)**

Next.js tự động tạo Suspense boundary với `loading.tsx`:

```
app/
  dashboard/
    page.tsx       # Server Component
    loading.tsx    # Tự động làm fallback cho page.tsx
```

**`app/dashboard/loading.tsx`:**
```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}
```

**`app/dashboard/page.tsx`:**
```tsx
// Không cần wrap Suspense - Next.js tự động
export default async function Dashboard() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### 4. **Suspense với Server Components fetch data**

```tsx
// app/blog/page.tsx
import { Suspense } from 'react'
import BlogList from '@/components/BlogList'
import BlogListSkeleton from '@/components/BlogListSkeleton'

export default function BlogPage() {
  return (
    <div>
      {/* Content này gửi ngay đến client */}
      <header>
        <h1>Welcome to the Blog</h1>
        <p>Read the latest posts below.</p>
      </header>
      
      <main>
        {/* Content trong Suspense sẽ được stream */}
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
```

**`components/BlogList.tsx`:**
```tsx
// Server Component
export default async function BlogList() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

### 5. **Suspense với Dynamic APIs**

Khi sử dụng Dynamic APIs như `cookies()`, `headers()`, `searchParams`:

```tsx
// app/user.tsx (Server Component)
import { cookies } from 'next/headers'

export async function User() {
  const session = (await cookies()).get('session')?.value
  return <div>User: {session}</div>
}
```

**Wrap trong Suspense để cho phép streaming:**

```tsx
// app/page.tsx
import { Suspense } from 'react'
import { User } from './user'

export default function Page() {
  return (
    <section>
      <h1>This will be prerendered</h1>
      <Suspense fallback={<AvatarSkeleton />}>
        <User />
      </Suspense>
    </section>
  )
}
```

### 6. **Suspense với React `use` hook**

Sử dụng Promise với `use` hook trong Client Components:

**`app/user-provider.tsx`:**
```tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'

type UserContextType = {
  userPromise: Promise<User | null>
}

const UserContext = createContext<UserContextType | null>(null)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export function UserProvider({
  children,
  userPromise
}: {
  children: ReactNode
  userPromise: Promise<User | null>
}) {
  return (
    <UserContext.Provider value={{ userPromise }}>
      {children}
    </UserContext.Provider>
  )
}
```

**`app/profile.tsx`:**
```tsx
'use client'

import { use } from 'react'
import { useUser } from './user-provider'
import { Suspense } from 'react'

function ProfileContent() {
  const { userPromise } = useUser()
  const user = use(userPromise) // Component sẽ suspend nếu Promise chưa resolve
  
  return <div>Hello {user?.name}</div>
}

export function Profile() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  )
}
```

---

## Best Practices

### 1. **Tạo Loading States có ý nghĩa**

Thay vì chỉ "Loading...", hãy dùng skeleton UI giống với content thực tế:

```tsx
// ❌ Không tốt
<Suspense fallback={<div>Loading...</div>}>
  <PostList />
</Suspense>

// ✅ Tốt
<Suspense fallback={<PostListSkeleton />}>
  <PostList />
</Suspense>
```

**`components/PostListSkeleton.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function PostListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2 p-4 border rounded">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  )
}
```

### 2. **Đặt Suspense ở đúng nơi**

- ✅ **Nên**: Wrap từng phần độc lập
- ❌ **Không nên**: Wrap toàn bộ page (trừ khi thực sự cần)

```tsx
// ✅ Tốt - Mỗi phần độc lập
<main>
  <Suspense fallback={<HeaderSkeleton />}>
    <Header />
  </Suspense>
  
  <Suspense fallback={<ContentSkeleton />}>
    <Content />
  </Suspense>
</main>

// ❌ Không tốt - Quá rộng
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Content />
  <Footer />
</Suspense>
```

### 3. **Sử dụng `loading.tsx` cho page-level loading**

Thay vì wrap toàn bộ page, dùng file `loading.tsx`:

```
app/
  dashboard/
    layout.tsx
    page.tsx
    loading.tsx    # ✅ Tự động làm fallback cho page.tsx
```

### 4. **Kết hợp với Error Boundaries**

```tsx
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingSkeleton />}>
        <AsyncComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 5. **Performance: Hoist data fetching**

Fetch data ở parent component, pass Promise xuống:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  const userPromise = getUser() // ⚠️ KHÔNG await
  
  return (
    <html>
      <body>
        <UserProvider userPromise={userPromise}>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
```

---

## Ví dụ thực tế trong project

### 1. **Providers với Suspense** (đã implement)

**`components/providers.tsx`:**
```tsx
"use client"

import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { Providers as QueryProviders } from "@/lib/api/client"
import { Loader2 } from "lucide-react"

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      </div>
    </div>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionProvider>      {/* Có thể init chậm */}
        <QueryProviders>     {/* Cần setup QueryClient */}
          {children}
        </QueryProviders>
      </SessionProvider>
    </Suspense>
  )
}
```

### 2. **Ví dụ: Dashboard với async data**

**`app/admin/dashboard/page.tsx`:**
```tsx
import { Suspense } from 'react'
import { AdminHeader } from '@/components/admin-header'
import { StatsCards } from '@/components/stats-cards'
import { StatsCardsSkeleton } from '@/components/stats-cards-skeleton'

export default function DashboardPage() {
  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Dashboard", isActive: true }]} />
      
      <div className="p-4">
        {/* Stats sẽ load async */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
      </div>
    </>
  )
}
```

**`components/stats-cards.tsx`:**
```tsx
// Server Component
import { prisma } from '@/lib/prisma'

export async function StatsCards() {
  // Fetch data từ database
  const [users, posts, notifications] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.notification.count({ where: { isRead: false } }),
  ])
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Users" value={users} />
      <Card title="Posts" value={posts} />
      <Card title="Notifications" value={notifications} />
    </div>
  )
}
```

**`components/stats-cards-skeleton.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
```

### 3. **Ví dụ: Posts list với pagination**

**`app/admin/posts/page.tsx`:**
```tsx
import { Suspense } from 'react'
import { AdminHeader } from '@/components/admin-header'
import { PostsList } from '@/components/posts-list'
import { PostsListSkeleton } from '@/components/posts-list-skeleton'

export default function PostsPage() {
  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Posts", isActive: true }]} />
      
      <div className="p-4">
        <Suspense fallback={<PostsListSkeleton />}>
          <PostsList />
        </Suspense>
      </div>
    </>
  )
}
```

### 4. **Ví dụ: Sử dụng `loading.tsx`**

Thay vì wrap Suspense thủ công, dùng `loading.tsx`:

**`app/admin/posts/loading.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}
```

**`app/admin/posts/page.tsx`:**
```tsx
// Không cần Suspense - Next.js tự động
export default async function PostsPage() {
  const posts = await prisma.post.findMany()
  return <PostsList posts={posts} />
}
```

---

## Tóm tắt

### ✅ **Nên dùng Suspense:**
1. Async Server Components
2. Client Components với async providers
3. Components fetch data từ API
4. Dynamic APIs (cookies, headers, searchParams)
5. Khi cần streaming rendering

### ❌ **Không cần Suspense:**
1. Sync components thông thường
2. Components chỉ render UI tĩnh
3. API Routes (server functions)
4. Client Components không async

### 📍 **Best Practices:**
1. Tạo loading states có ý nghĩa (skeleton UI)
2. Đặt Suspense boundary ở đúng nơi (từng phần độc lập)
3. Sử dụng `loading.tsx` cho page-level loading
4. Kết hợp với Error Boundaries
5. Hoist data fetching lên parent khi có thể

### 🎯 **Lợi ích:**
- ✅ Streaming SSR - Progressive rendering
- ✅ Selective hydration - Ưu tiên phần tương tác
- ✅ Better UX - Không block toàn bộ UI
- ✅ SEO friendly - Server-rendered

---

## Tài liệu tham khảo

- [Next.js Suspense Documentation](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [Next.js Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data)

