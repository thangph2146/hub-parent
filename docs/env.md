# ============================================================================
# ⚠️ CẢNH BÁO BẢO MẬT
# ============================================================================
# File này là TEMPLATE cho environment variables
# KHÔNG BAO GIỜ commit các giá trị thực (secrets, passwords, keys) vào git!
# 
# Các biến NGUY HIỂM cần được giữ bí mật:
# - DATABASE_URL (chứa credentials database)
# - NEXTAUTH_SECRET (dùng để sign JWT tokens)
# - GOOGLE_CLIENT_SECRET (OAuth secret)
# - Các API keys, tokens, passwords khác
#
# Sau khi setup:
# 1. Copy file này thành .env.local (không commit)
# 2. Điền các giá trị thực vào .env.local
# 3. Đảm bảo .env.local được ignore trong .gitignore
# ============================================================================

# ============================================================================
# Security - Database Configuration
# ============================================================================
# PostgreSQL connection string
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?[params]
# ⚠️ NGUY HIỂM: Chứa username và password - KHÔNG commit giá trị thực!
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# ============================================================================
# Security - NextAuth / Google OAuth & JWT Configuration
# ============================================================================
# NextAuth URL - Base URL của ứng dụng
# Development: http://localhost:3000
# Production: https://yourdomain.com
NEXTAUTH_URL="http://localhost:3000"

# NextAuth Secret - BẮT BUỘC cho JWT signing
# ⚠️ NGUY HIỂM: Secret này được dùng để sign và verify JWT tokens
# Tạo secret mạnh bằng lệnh: openssl rand -base64 32
# Phải có ít nhất 32 ký tự
# KHÔNG BAO GIỜ commit secret thực vào git!
NEXTAUTH_SECRET="your-generated-nextauth-secret-min-32-chars"

# Google OAuth Configuration
# 1. Tạo OAuth Client ID (Web application) trong Google Cloud Console
#    - Truy cập: https://console.cloud.google.com/apis/credentials
# 2. Thêm Authorized redirect URI: http://localhost:3000/api/auth/callback/google
# 3. Copy Client ID và Client Secret vào các biến dưới đây
# ⚠️ NGUY HIỂM: GOOGLE_CLIENT_SECRET là thông tin nhạy cảm - KHÔNG commit!
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Có thể sử dụng alias AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET nếu thích:
# AUTH_GOOGLE_ID="your-google-client-id"
# AUTH_GOOGLE_SECRET="your-google-client-secret"

# JWT Configuration Notes:
# - Dự án sử dụng JWT strategy (không dùng database session)
# - JWT tokens có thời gian sống 7 ngày
# - Session tự động refresh mỗi 24 giờ
# - Xem thêm: docs/jwt-config.md

# ============================================================================
# Proxy Configuration (Next.js 16)
# ============================================================================
# External API Base URL: URL của backend API để proxy requests
# Development: http://localhost:8000/api
# Production: https://api.yourdomain.com/api
EXTERNAL_API_BASE_URL="http://localhost:8000/api"

# CORS: Danh sách origins được phép (phân cách bởi dấu phẩy)
# Chỉ cho phép các domain được liệt kê ở đây gọi API
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Maintenance Mode: Bật/tắt chế độ bảo trì
# Khi bật, tất cả requests (trừ bypass) sẽ bị chặn
# MAINTENANCE_MODE="false"
# MAINTENANCE_BYPASS_KEY="your-secret-bypass-key"

# IP Whitelist: Danh sách IP được phép truy cập admin (phân cách bởi dấu phẩy)
# Chỉ áp dụng cho routes /admin và /api/admin
# Để trống để cho phép tất cả IP
# ALLOWED_IPS="127.0.0.1,192.168.1.1"

# ============================================================================
# Logger & Debugging Configuration
# ============================================================================
# Debug Mode: Bật/tắt logging chi tiết cho toàn bộ ứng dụng
# - Trong development mode (NODE_ENV=development), logging tự động bật
# - Đặt DEBUG="true" để bật logging trong production
# - Logger sẽ hiển thị: timestamp, vị trí file, chi tiết log, và stack trace cho errors
# DEBUG="false"

# Socket Debug Mode: Bật/tắt debug logging cho Socket.IO
# - Đặt SOCKET_DEBUG="true" để xem chi tiết các events, connections, và messages
# - Logs sẽ hiển thị: connection/disconnection, room joins/leaves, message sending, notifications
# SOCKET_DEBUG="false"

# ============================================================================
# Environment
# ============================================================================
# Development / Production environment
# development: Bật debug, logging chi tiết
# production: Tối ưu performance, ít logging
NODE_ENV="development"

# ============================================================================
# HƯỚNG DẪN SETUP
# ============================================================================
# 1. Copy file này: cp docs/env.md .env.local
# 2. Mở .env.local và thay thế tất cả placeholder values bằng giá trị thực
# 3. Đảm bảo .env.local đã được ignore trong .gitignore
# 4. Không bao giờ commit file .env.local hoặc file .env nào chứa secrets
# 5. Test ứng dụng để đảm bảo tất cả environment variables hoạt động đúng
