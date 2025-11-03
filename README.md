# Core CMS 16

Hệ thống quản trị nội dung được xây dựng với [Next.js 16](https://nextjs.org) sử dụng App Router.

## Cấu trúc dự án

Dự án được tổ chức theo best practices của Next.js 16:

```
core-cms-16/
├── src/                    # Source code chính
│   ├── app/               # App Router - routes và pages
│   │   ├── (public)/      # Route group cho public pages
│   │   ├── admin/         # Admin routes
│   │   ├── auth/          # Authentication routes
│   │   └── api/           # API routes (App Router)
│   ├── components/        # React components
│   │   ├── ui/           # UI components (shadcn/ui)
│   │   └── providers/    # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities và helpers
│   │   ├── api/         # API clients
│   │   └── socket/      # Socket.IO state management
│   └── types/           # TypeScript type definitions
├── prisma/               # Prisma schema và migrations
├── public/               # Static assets
├── docs/                 # Documentation
└── ...config files
```

### Chi tiết cấu trúc

- **`src/app/`**: App Router directory - mỗi folder tương ứng với một route
  - `(public)/`: Route group cho các trang công khai
  - `admin/`: Routes cho admin dashboard
  - `auth/`: Authentication pages (sign-in, sign-up)
  - `api/`: API routes sử dụng Route Handlers

- **`src/components/`**: React components
  - `ui/`: Reusable UI components (shadcn/ui)
  - `providers/`: Context providers (Theme, Session, Query)

- **`src/lib/`**: Shared utilities
  - `api/`: API client configurations
  - `auth.ts`: NextAuth configuration
  - `prisma.ts`: Prisma client instance
  - `utils.ts`: Utility functions

- **`src/hooks/`**: Custom React hooks

- **`src/types/`**: TypeScript type definitions

## Getting Started

Cài đặt dependencies:

```bash
pnpm install
```

Chạy development server:

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

Build cho production:

```bash
pnpm build
pnpm start
```

## Tính năng

- ✅ Next.js 16 với App Router
- ✅ TypeScript
- ✅ NextAuth.js v5 cho authentication
- ✅ Prisma ORM
- ✅ Socket.IO cho real-time communication
- ✅ TanStack Query cho data fetching
- ✅ Tailwind CSS với shadcn/ui
- ✅ Dark mode support

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
