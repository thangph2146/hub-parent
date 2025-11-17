# Core CMS 16

Hệ thống quản trị nội dung (CMS) được xây dựng với [Next.js 16](https://nextjs.org) sử dụng App Router, NextAuth v5, Prisma ORM, và Socket.IO cho real-time communication.

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc dự án](#cấu-trúc-dự-án)
3. [Cài đặt và Setup](#cài-đặt-và-setup)
4. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
5. [Bố cục triển khai](#bố-cục-triển-khai)
6. [Flow của hệ thống](#flow-của-hệ-thống)
7. [Best Practices](#best-practices)
8. [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

### Tính năng chính

- ✅ **Next.js 16** với App Router và Server Components
- ✅ **NextAuth.js v5** cho authentication và authorization
- ✅ **Prisma ORM** với PostgreSQL/MySQL
- ✅ **Socket.IO** cho real-time communication (notifications, chat)
- ✅ **TanStack Query** cho data fetching và caching
- ✅ **Tailwind CSS** với shadcn/ui components
- ✅ **Dark mode** support
- ✅ **Role-based permissions** system
- ✅ **Soft delete** pattern cho tất cả resources
- ✅ **Real-time notifications** qua Socket.IO
- ✅ **Rich text editor** với Lexical
- ✅ **Data tables** với filtering, sorting, pagination

### Kiến trúc

Hệ thống được xây dựng theo **Feature-based Architecture** với Next.js 16 App Router:

```
┌─────────────────────────────────────────────────────────┐
│  Public Pages (Server Components)                      │
│  - Trang chủ, Bài viết, Giới thiệu, Liên hệ            │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Authentication Layer (NextAuth v5)                     │
│  - Sign in/Sign up                                       │
│  - Session management                                    │
│  - Permission-based access control                      │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Admin Panel (Protected Routes)                         │
│  - Dashboard                                             │
│  - Resource Management (Users, Posts, Categories...)   │
│  - Real-time Chat                                        │
│  - Notifications                                         │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  API Layer (Route Handlers)                             │
│  - RESTful API với permission checks                    │
│  - Real-time events (Socket.IO)                        │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Database Layer (Prisma ORM)                            │
│  - PostgreSQL/MySQL                                     │
│  - Migrations và seeding                                │
└─────────────────────────────────────────────────────────┘
```

---

## Cấu trúc dự án

### Tổng quan

```
core-cms-16/
├── src/
│   ├── app/                          # App Router - routes và pages
│   │   ├── (public)/                 # Route group cho public pages
│   │   │   ├── page.tsx             # Trang chủ
│   │   │   ├── bai-viet/            # Blog posts (public)
│   │   │   ├── ve-chung-toi/        # About page
│   │   │   ├── lien-he/             # Contact page
│   │   │   └── huong-dan-su-dung/    # Help page
│   │   ├── [resource]/               # Dynamic route cho admin resources
│   │   │   ├── dashboard/            # Dashboard
│   │   │   ├── users/                # Users management
│   │   │   ├── posts/                # Posts management
│   │   │   ├── categories/           # Categories management
│   │   │   ├── tags/                 # Tags management
│   │   │   ├── roles/                # Roles management
│   │   │   ├── comments/             # Comments management
│   │   │   ├── students/             # Students management
│   │   │   ├── sessions/             # Sessions management
│   │   │   ├── contact-requests/      # Contact requests
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── messages/             # Chat messages
│   │   │   └── accounts/             # User accounts
│   │   ├── auth/                     # Authentication pages
│   │   │   ├── sign-in/              # Sign in page
│   │   │   └── sign-up/              # Sign up page
│   │   ├── api/                      # API routes
│   │   │   ├── (public)/             # Public API routes
│   │   │   ├── admin/                # Admin API routes
│   │   │   ├── auth/                 # NextAuth API routes
│   │   │   ├── notifications/        # Notifications API
│   │   │   └── roles/                # Roles API
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # UI components (shadcn/ui)
│   │   ├── layouts/                  # Layout components
│   │   │   ├── headers/              # Header components
│   │   │   ├── footers/              # Footer components
│   │   │   ├── navigation/           # Navigation components
│   │   │   ├── providers/            # Context providers
│   │   │   └── shared/                # Shared layout components
│   │   ├── forms/                    # Form components
│   │   ├── dialogs/                  # Dialog components
│   │   ├── tables/                   # Data table components
│   │   ├── editor/                   # Rich text editor (Lexical)
│   │   ├── chat/                     # Chat components
│   │   └── public/                   # Public page components
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── admin/                    # Admin features
│   │   │   ├── users/                # Users feature
│   │   │   ├── posts/                # Posts feature
│   │   │   ├── categories/           # Categories feature
│   │   │   ├── tags/                 # Tags feature
│   │   │   ├── roles/                # Roles feature
│   │   │   ├── comments/             # Comments feature
│   │   │   ├── students/             # Students feature
│   │   │   ├── sessions/             # Sessions feature
│   │   │   ├── contact-requests/      # Contact requests feature
│   │   │   ├── notifications/        # Notifications feature
│   │   │   ├── chat/                 # Chat feature
│   │   │   ├── dashboard/            # Dashboard feature
│   │   │   ├── accounts/             # Accounts feature
│   │   │   └── resources/            # Shared resource utilities
│   │   └── public/                   # Public features
│   │       ├── home/                 # Home page feature
│   │       ├── about/                # About page feature
│   │       ├── contact/              # Contact page feature
│   │       ├── help/                  # Help page feature
│   │       └── post/                  # Post detail feature
│   │
│   ├── lib/                          # Shared utilities và configs
│   │   ├── api/                      # API utilities
│   │   │   ├── api-route-wrapper.ts  # API route security wrapper
│   │   │   ├── routes.ts             # API routes config
│   │   │   ├── client.ts              # API client
│   │   │   └── validation.ts          # Validation helpers
│   │   ├── auth/                     # Authentication
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   ├── auth-server.ts        # Server-side auth utilities
│   │   │   └── auth-client.ts        # Client-side auth utilities
│   │   ├── permissions/              # Permissions system
│   │   │   ├── permissions.ts        # Permission definitions
│   │   │   ├── route-config.ts       # Route permissions config
│   │   │   ├── route-permissions.ts   # Page route permissions
│   │   │   └── api-route-permissions.ts # API route permissions
│   │   ├── database/                  # Database (Prisma)
│   │   │   └── prisma.ts              # Prisma client instance
│   │   ├── config/                    # App configuration
│   │   │   ├── app-features.ts        # Feature definitions
│   │   │   ├── menu-data.ts           # Menu generation
│   │   │   └── resource-map.ts        # Resource mapping
│   │   ├── socket/                    # Socket.IO utilities
│   │   │   ├── server.ts              # Socket server setup
│   │   │   └── state.ts               # Socket state management
│   │   └── utils/                     # General utilities
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-session.ts            # Session hook
│   │   ├── use-permissions.ts        # Permissions hook
│   │   ├── use-socket.ts             # Socket.IO hook
│   │   ├── use-notifications.ts      # Notifications hook
│   │   └── ...                       # Other custom hooks
│   │
│   └── types/                        # TypeScript type definitions
│       └── next-auth.d.ts            # NextAuth type extensions
│
├── prisma/                           # Prisma schema và migrations
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Database seeding script
│
├── public/                           # Static assets
│   ├── avatars/                     # Avatar images
│   └── svg/                         # SVG icons
│
├── docs/                             # Documentation
│   ├── admin-architecture.md        # Admin architecture docs
│   ├── auth-architecture.md          # Auth architecture docs
│   ├── folder-structure.md           # Folder structure guide
│   ├── data-table.md                 # Data table docs
│   ├── filter-options-api-pattern.md # Filter options pattern
│   ├── env.md                        # Environment variables guide
│   ├── security.md                   # Security best practices
│   └── permissions-audit.md         # Permissions audit
│
├── proxy.ts                          # Next.js 16 Proxy (Edge Runtime)
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── components.json                   # shadcn/ui configuration
└── package.json                      # Dependencies và scripts
```

### Chi tiết cấu trúc Feature

Mỗi feature trong `src/features/admin/` follow cùng một pattern:

```
src/features/admin/{resource}/
├── components/                       # React components
│   ├── index.ts                     # Export barrel
│   ├── {resource}-table.tsx         # Server Component (fetch data)
│   ├── {resource}-table.client.tsx  # Client Component (UI/interactions)
│   ├── {resource}-detail.tsx        # Server Component (fetch data)
│   ├── {resource}-detail.client.tsx # Client Component (UI/interactions)
│   ├── {resource}-create.tsx        # Server Component (fetch options)
│   ├── {resource}-create.client.tsx # Client Component (form)
│   ├── {resource}-edit.tsx          # Server Component (fetch data)
│   └── {resource}-edit.client.tsx   # Client Component (form)
│
├── server/                           # Server-side logic
│   ├── index.ts                     # Export barrel
│   ├── queries.ts                   # Non-cached database queries
│   ├── cache.ts                     # Cached queries với React cache()
│   ├── mutations.ts                 # Create, update, delete operations
│   ├── helpers.ts                   # Serialization, mapping helpers
│   ├── notifications.ts             # Real-time notifications
│   └── schemas.ts                   # Zod validation schemas
│
├── hooks/                            # Custom hooks (optional)
│   └── index.ts                     # Export barrel
│
├── types.ts                          # TypeScript type definitions
├── form-fields.ts                   # Form field definitions
└── utils.ts                          # Utility functions
```

---

## Cài đặt và Setup

### Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (hoặc npm >= 9.0.0)
- **Database**: PostgreSQL hoặc MySQL
- **Git**: >= 2.0.0

### 1. Cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd core-cms-16

# Cài đặt dependencies
pnpm install
```

### 2. Setup Environment Variables

⚠️ **QUAN TRỌNG**: File `docs/env.md` chỉ chứa placeholders. Bạn cần tạo file `.env.local` với giá trị thực:

```bash
# Copy template
cp docs/env.md .env.local

# Chỉnh sửa .env.local và điền các giá trị thực:
# - DATABASE_URL (connection string của database)
# - NEXTAUTH_SECRET (tạo bằng: openssl rand -base64 32)
# - NEXTAUTH_URL (URL của ứng dụng, ví dụ: http://localhost:3000)
# - GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET (từ Google Cloud Console, nếu dùng Google OAuth)
```

**Lưu ý bảo mật**:
- ❌ KHÔNG commit file `.env.local` vào git
- ❌ KHÔNG commit bất kỳ file nào chứa secrets thực
- ✅ Xem `docs/security.md` để biết thêm về security best practices

### 3. Setup Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database với sample data
pnpm prisma db seed
```

### 4. Chạy Development Server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

### 5. Build cho Production

```bash
# Build production
pnpm build

# Start production server
pnpm start
```

---

## Hướng dẫn sử dụng

### 1. Authentication

#### Đăng ký tài khoản

1. Truy cập `/auth/sign-up`
2. Điền thông tin: Email, Password, Name
3. Click "Đăng ký"
4. Hệ thống sẽ tự động tạo tài khoản và đăng nhập

#### Đăng nhập

1. Truy cập `/auth/sign-in`
2. Điền Email và Password
3. Click "Đăng nhập"
4. Hệ thống sẽ redirect đến dashboard hoặc trang bạn đang truy cập trước đó

#### Đăng xuất

1. Click vào avatar ở góc trên bên phải
2. Click "Đăng xuất"

### 2. Admin Panel

#### Dashboard

- Truy cập `/admin/dashboard` (hoặc `/[resource]/dashboard`)
- Xem thống kê tổng quan về hệ thống
- Xem các thông báo mới nhất

#### Quản lý Resources

Mỗi resource (Users, Posts, Categories, Tags, Roles, Comments, Students, Sessions, Contact Requests, Notifications) có các chức năng:

**List Page** (`/admin/{resource}`):
- Xem danh sách với pagination
- Tìm kiếm và filter
- Sort theo các cột
- Bulk actions (delete, restore)
- Row actions (view, edit, delete, restore)

**Detail Page** (`/admin/{resource}/[id]`):
- Xem chi tiết resource
- Edit button (nếu có quyền)
- Delete button (nếu có quyền)

**Create Page** (`/admin/{resource}/new`):
- Form tạo mới resource
- Validation real-time
- Auto-save (optional)

**Edit Page** (`/admin/{resource}/[id]/edit`):
- Form chỉnh sửa resource
- Validation real-time
- Auto-save (optional)

#### Permissions

Hệ thống sử dụng role-based permissions:

- **Super Admin**: Full access to all resources
- **Admin**: Access to most resources (tùy cấu hình)
- **User**: Limited access (tùy cấu hình)

Mỗi resource có các permissions:
- `{RESOURCE}_VIEW`: Xem danh sách và chi tiết
- `{RESOURCE}_CREATE`: Tạo mới
- `{RESOURCE}_UPDATE`: Chỉnh sửa
- `{RESOURCE}_DELETE`: Xóa (soft delete)
- `{RESOURCE}_MANAGE`: Full access (bao gồm hard delete, restore)

### 3. Real-time Features

#### Notifications

- Real-time notifications qua Socket.IO
- Hiển thị trong notification bell icon
- Click để xem chi tiết
- Mark as read/unread

#### Chat

- Real-time chat với Socket.IO
- 1-on-1 conversations
- Group chats
- File attachments
- Message search

### 4. Public Pages

#### Trang chủ

- Truy cập `/` để xem trang chủ
- Hiển thị thông tin tổng quan về hệ thống

#### Blog Posts

- Truy cập `/bai-viet` để xem danh sách bài viết
- Truy cập `/bai-viet/[slug]` để xem chi tiết bài viết

#### Giới thiệu

- Truy cập `/ve-chung-toi` để xem thông tin về hệ thống

#### Liên hệ

- Truy cập `/lien-he` để gửi liên hệ
- Form sẽ tạo Contact Request trong admin panel

#### Hướng dẫn sử dụng

- Truy cập `/huong-dan-su-dung` để xem hướng dẫn

---

## Bố cục triển khai

### 1. Architecture Layers

Hệ thống được chia thành 4 layers chính:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Proxy (Edge Runtime)                          │
│ - CORS validation                                       │
│ - Maintenance mode check                                │
│ - IP whitelist cho admin routes                         │
│ - Security headers                                      │
│ - KHÔNG làm authentication redirects                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Layouts (Server Components)                   │
│ - Fetch session với getSession()                       │
│ - KHÔNG redirect (vì Partial Rendering)                │
│ - Pass data xuống children                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: PermissionGate (Server → Client)              │
│ - Server: Fetch permissions                             │
│ - Client: Validate session với useSession()            │
│ - Client: Permission checks chi tiết                    │
│ - Client: Redirects nếu cần                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: API Routes (DAL - Data Access Layer)          │
│ - Security checks chính khi fetch data                 │
│ - Database validation                                  │
│ - API route wrappers với createApiRoute               │
└─────────────────────────────────────────────────────────┘
```

### 2. Data Flow

#### Pattern: Page → Server Component → Client Component

```
1. Page (Server Component)
   └──> Fetch permissions
   └──> Render feature Server Component

2. Feature Server Component
   └──> Fetch data với cached queries (React cache())
   └──> Serialize data (dates → strings)
   └──> Pass xuống Client Component

3. Feature Client Component
   └──> Render UI
   └──> Handle interactions
   └──> Call API routes khi cần
```

#### Pattern: API Route → Mutation

```
1. API Route Handler
   └──> Validate input
   └──> Build AuthContext (actorId, permissions, roles)
   └──> Call mutation

2. Mutation
   └──> Check permissions
   └──> Validate business rules
   └──> Execute database operations
   └──> Emit real-time notifications (Socket.IO)
   └──> Return result
```

### 3. Component Architecture

#### Server Components

- **Location**: `src/features/admin/{resource}/components/{resource}-*.tsx`
- **Purpose**: Fetch data và pass xuống client
- **Pattern**: 
  ```typescript
  export async function ResourceTable({ canDelete, canRestore }: Props) {
    const data = await listResourcesCached(...)
    return <ResourceTableClient initialData={serializeData(data)} />
  }
  ```

#### Client Components

- **Location**: `src/features/admin/{resource}/components/{resource}-*.client.tsx`
- **Purpose**: UI/interactions, forms, data tables
- **Pattern**:
  ```typescript
  "use client"
  export function ResourceTableClient({ initialData }: Props) {
    const loader = useCallback(async (query) => {
      const response = await apiClient.get(apiRoutes.resources.list, { params: query })
      return response.data
    }, [])
    
    return <ResourceTableClient columns={columns} loader={loader} initialData={initialData} />
  }
  ```

### 4. Server Functions

#### Queries (`server/queries.ts`)

- **Purpose**: Non-cached database queries
- **Usage**: API routes
- **Pattern**:
  ```typescript
  export async function listResources(params: ListResourcesInput) {
    const where = buildWhereClause(params)
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({ where, ... }),
      prisma.resource.count({ where })
    ])
    return { data: resources.map(mapResource), pagination: buildPagination(...) }
  }
  ```

#### Cache (`server/cache.ts`)

- **Purpose**: Cached queries với React `cache()`
- **Usage**: Server Components
- **Pattern**:
  ```typescript
  export const listResourcesCached = cache(
    async (page: number, limit: number, search: string) => {
      return listResources({ page, limit, search })
    }
  )
  ```

#### Mutations (`server/mutations.ts`)

- **Purpose**: Create, update, delete operations với permission checks
- **Usage**: API routes
- **Pattern**:
  ```typescript
  export async function createResource(ctx: AuthContext, input: CreateResourceInput) {
    ensurePermission(ctx, PERMISSIONS.RESOURCE_CREATE, PERMISSIONS.RESOURCE_MANAGE)
    // Validate input
    // Execute database operation
    // Emit notifications
    return result
  }
  ```

### 5. Permissions System

#### Route Configuration (`lib/permissions/route-config.ts`)

- **Purpose**: Single source of truth cho route permissions
- **Pattern**:
  ```typescript
  ...generateResourceRoutes({
    name: "users",
    permissions: {
      view: PERMISSIONS.USERS_VIEW,
      create: PERMISSIONS.USERS_CREATE,
      update: PERMISSIONS.USERS_UPDATE,
      delete: PERMISSIONS.USERS_DELETE,
      manage: PERMISSIONS.USERS_MANAGE,
    },
    adminApi: true,
  })
  ```

#### Permission Checking

- **Page Level**: `PermissionGate` component
- **API Level**: `createApiRoute` wrapper tự động check permissions từ `ROUTE_CONFIG`

---

## Flow của hệ thống

### 1. Authentication Flow

#### Case 1: Chưa đăng nhập truy cập `/admin/users`

```
1. Proxy (Edge Runtime)
   ├─> CORS check → Pass
   ├─> Maintenance check → Pass
   ├─> IP whitelist check → Pass
   └─> Continue → Layout

2. Admin Layout (Server Component)
   ├─> Fetch session với getSession() → null
   └─> Render children (không redirect)

3. PermissionGateClient (Client Component)
   ├─> useSession() → status: "unauthenticated"
   ├─> Check pathname → startsWith("/admin")
   └─> Redirect → /auth/sign-in?callbackUrl=/admin/users
```

#### Case 2: Đã đăng nhập truy cập `/auth/sign-in`

```
1. Proxy (Edge Runtime)
   ├─> CORS check → Pass
   └─> Continue → Layout

2. Auth Layout (Server Component)
   ├─> Fetch session với getSession() → có session
   └─> Render PermissionGate wrapper

3. PermissionGate (Server Component)
   ├─> Fetch permissions
   └─> Pass xuống PermissionGateClient

4. PermissionGateClient (Client Component)
   ├─> useSession() → status: "authenticated"
   ├─> Check pathname → startsWith("/auth")
   └─> Block access → Hiển thị ForbiddenNotice
```

### 2. Resource Management Flow

#### Create Resource Flow

```
1. User clicks "Create Resource" button
   └──> Navigate to /admin/{resource}/new

2. Page (Server Component)
   └──> Render AdminHeader với breadcrumbs
   └──> Render ResourceCreate component

3. ResourceCreate (Server Component)
   └──> Fetch options với getOptionsCached() (cached query)
   └──> Pass options xuống ResourceCreateClient

4. ResourceCreateClient (Client Component)
   └──> Render form với options
   └──> User fills form and submits

5. Form submission
   └──> Call POST /api/admin/{resource}
   └──> API route validates input
   └──> Build AuthContext (actorId, permissions, roles)
   └──> Call createResource() mutation
   └──> Mutation checks permissions
   └──> Validate business rules
   └──> Create resource in database
   └──> Emit real-time notifications to super admins (via Socket.IO)
   └──> Return sanitized resource data

6. Success
   └──> Redirect to /admin/{resource}/[id]
   └──> Invalidate queries
   └──> Refresh table
```

#### Update Resource Flow

```
1. UserEditClient submits form
   └──> Call PUT /api/admin/{resource}/[id]

2. API Route Handler
   └──> Validate ID
   └──> Parse request body
   └──> Validate input fields
   └──> Build AuthContext
   └──> Call updateResource() mutation

3. Mutation (mutations.ts)
   └──> Check permissions (RESOURCE_UPDATE or RESOURCE_MANAGE)
   └──> Validate resource exists
   └──> Track changes
   └──> Update resource in database (transaction)
   └──> Emit real-time notifications if changes detected (via Socket.IO)
   └──> Return sanitized resource data

4. Success
   └──> Return 200 with updated resource
   └──> Client invalidates queries
   └──> Refresh UI
```

### 3. Real-time Notifications Flow

```
1. Mutation executes (create/update/delete)
   └──> Call notifySuperAdminsOfResourceAction()

2. Notification Helper (notifications.ts)
   ├──> Format notification title và description
   ├──> Create notification trong database cho tất cả super admins
   ├──> Fetch notifications từ database để lấy IDs thực tế
   └──> Emit Socket.IO events:
       ├──> To each super admin room: `user:${adminId}`
       ├──> To role room: `role:super_admin`
       └──> Store in cache

3. Client receives notification
   ├──> Socket.IO client receives "notification:new" event
   ├──> Update notification state
   └──> Show notification bell badge
```

### 4. Chat Flow

```
1. User opens chat
   └──> Connect to Socket.IO server
   └──> Join user room: `user:${userId}`

2. User sends message
   └──> Call POST /api/admin/messages
   └──> API route validates input
   └──> Call createMessage() mutation
   └──> Save message to database
   └──> Emit Socket.IO event to recipient room
   └──> Update unread counts

3. Recipient receives message
   ├──> Socket.IO client receives "message:new" event
   ├──> Update chat state
   └──> Show notification
```

---

## Best Practices

### ✅ Nên làm

1. **Server Components First**
   - Fetch data trong Server Components
   - Pass serialized data xuống Client Components
   - Sử dụng cached queries với React `cache()`

2. **Type Safety**
   - Luôn dùng Prisma types từ `@prisma/client`
   - Serialize data trước khi pass vào Client Components
   - Dùng Zod schemas cho validation

3. **Error Handling**
   - Server-side: Zod validation + Prisma error handling
   - Client-side: `useResourceFormSubmit` hook tự động handle errors
   - Toast notifications cho user feedback

4. **Performance**
   - Server Components cho initial data fetching
   - React.useMemo và React.useCallback cho expensive operations
   - TanStack Query với caching
   - Prisma query optimization (select only needed fields)

5. **Real-time Updates**
   - Socket.IO notifications cho tất cả mutations
   - Cache invalidation sau mutations
   - Optimistic updates khi có thể

6. **Permissions**
   - Check permissions ở Server Components
   - Pass permission flags vào Client Components
   - Conditional rendering dựa trên permissions
   - Server-side validation cho tất cả mutations

### ❌ Không nên làm

1. **KHÔNG fetch data trong Client Component useEffect**
   ```typescript
   // ❌ BAD
   "use client"
   useEffect(() => {
     apiClient.get("/users").then(setUsers)
   }, [])
   
   // ✅ GOOD
   // Server Component fetch data và pass xuống
   ```

2. **KHÔNG mix server và client logic**
   ```typescript
   // ❌ BAD
   export async function UserDetail({ userId }) {
     const user = await getUser(userId)
     const router = useRouter() // ❌ Cannot use hooks
   }
   ```

3. **KHÔNG đặt business logic trong API routes**
   ```typescript
   // ❌ BAD
   export async function POST(req) {
     // Business logic here
     await prisma.user.create({ ... })
   }
   
   // ✅ GOOD
   export async function POST(req) {
     const user = await createUser(ctx, input)
   }
   ```

4. **KHÔNG hardcode URLs hoặc query keys**
   ```typescript
   // ❌ BAD
   await apiClient.get(`/api/admin/users/${id}`)
   
   // ✅ GOOD
   await apiClient.get(apiRoutes.users.detail(id))
   ```

---

## Tài liệu tham khảo

### Documentation Files

- [Admin Architecture](docs/admin-architecture.md) - Chi tiết về kiến trúc Admin Panel
- [Auth Architecture](docs/auth-architecture.md) - Chi tiết về authentication và authorization
- [Folder Structure](docs/folder-structure.md) - Hướng dẫn tổ chức folder và code
- [Data Table](docs/data-table.md) - Hướng dẫn sử dụng Data Table component
- [Filter Options API Pattern](docs/filter-options-api-pattern.md) - Pattern cho filter options API
- [Environment Variables](docs/env.md) - Hướng dẫn cấu hình environment variables
- [Security Best Practices](docs/security.md) - Quy tắc bảo mật và quản lý secrets
- [Permissions Audit](docs/permissions-audit.md) - Audit permissions system

### External Resources

- [Next.js 16 Documentation](https://nextjs.org/docs) - Next.js features và API
- [Next.js 16 App Router](https://nextjs.org/docs/app) - App Router guide
- [NextAuth.js v5 Documentation](https://authjs.dev) - NextAuth.js documentation
- [Prisma Documentation](https://www.prisma.io/docs) - Prisma ORM documentation
- [TanStack Query](https://tanstack.com/query) - React Query documentation
- [Socket.IO Documentation](https://socket.io/docs) - Socket.IO documentation
- [Lexical Editor](https://lexical.dev) - Lexical rich text editor
- [shadcn/ui](https://ui.shadcn.com) - UI components documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind CSS documentation

### Learn More

- [Next.js Learn](https://nextjs.org/learn) - Interactive Next.js tutorial
- [React Server Components](https://react.dev/reference/rsc/server-components) - React Server Components reference
- [React cache() API](https://react.dev/reference/react/cache) - React cache() reference

---

## Deploy

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Environment Variables for Production

Đảm bảo set các environment variables sau trong production:

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret key cho NextAuth (tạo bằng: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL của ứng dụng (ví dụ: `https://your-domain.com`)
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` (nếu dùng Google OAuth)

---

**Last Updated:** 2024  
**Version:** 1.0.0
