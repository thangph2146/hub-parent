# Cấu hình NextAuth.js với JWT

Dự án này sử dụng NextAuth.js với JWT (JSON Web Token) strategy để quản lý authentication.

## Tổng quan

JWT strategy cho phép:
- **Stateless authentication**: Không cần lưu session trong database
- **Performance**: Nhanh hơn vì không cần query database mỗi request
- **Scalability**: Dễ dàng scale horizontal vì không phụ thuộc session store
- **Flexibility**: Token có thể được sử dụng ở nhiều services khác nhau

## Cấu hình

### 1. Environment Variables

Đảm bảo có các biến môi trường sau trong `.env`:

```env
# JWT Secret - BẮT BUỘC
# Tạo secret mạnh bằng: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key-here

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000
```

### 2. JWT Configuration

Cấu hình JWT được định nghĩa trong `src/lib/auth.ts`:

```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60, // 7 ngày
  updateAge: 24 * 60 * 60,  // Update session mỗi 24 giờ
},
secret: process.env.NEXTAUTH_SECRET,
```

**Lưu ý**: Trong NextAuth v5, JWT configuration được quản lý thông qua:
- `session.strategy: "jwt"` - Bật JWT strategy
- `secret` - Secret key cho JWT signing (bắt buộc)
- `jwt` callback - Custom JWT token creation và refresh

### 3. JWT Token Structure

JWT token chứa các thông tin sau:

```typescript
{
  id: string              // User ID
  email: string          // User email
  name: string           // User name
  picture: string        // User avatar URL
  permissions: string[]  // User permissions
  roles: Array<{         // User roles
    id: string
    name: string
    displayName: string
  }>
  iat: number            // Issued at timestamp
  exp: number            // Expiration timestamp
  sub: string            // Subject (user ID)
}
```

## JWT Callbacks

### 1. JWT Callback

Callback này được gọi khi:
- User đăng nhập lần đầu
- Token được refresh (khi session được update)
- Token thiếu thông tin permissions/roles

```typescript
async jwt({ token, user, trigger }) {
  // Khi user đăng nhập
  if (user) {
    token.id = user.id
    token.permissions = user.permissions ?? []
    token.roles = user.roles ?? []
  }
  
  // Khi session được update
  if (trigger === "update") {
    // Refresh data từ database
  }
  
  return token
}
```

### 2. Session Callback

Callback này chuyển đổi JWT token thành session object:

```typescript
async session({ session, token }) {
  session.user.id = token.id
  session.permissions = token.permissions ?? []
  session.roles = token.roles ?? []
  return session
}
```

## Security Best Practices

### 1. Secret Key

- ✅ Sử dụng secret key mạnh (ít nhất 32 ký tự)
- ✅ Không commit secret key vào git
- ✅ Sử dụng các secret khác nhau cho dev/staging/production
- ✅ Rotate secret key định kỳ

### 2. Token Expiration

- ✅ Đặt maxAge hợp lý (7 ngày là tốt cho web app)
- ✅ Sử dụng `updateAge` để tự động refresh token
- ✅ Implement refresh token mechanism nếu cần

### 3. Token Size

- ⚠️ JWT token size có giới hạn (~8KB)
- ⚠️ Không lưu quá nhiều data trong token
- ✅ Chỉ lưu data cần thiết cho authentication/authorization

### 4. HTTPS

- ✅ Luôn sử dụng HTTPS trong production
- ✅ Secure cookie flags (httpOnly, secure, sameSite)

## Advanced Configuration

### Encryption (Optional)

Trong NextAuth v5, JWT encryption được xử lý tự động. Nếu cần custom encryption, có thể implement trong `jwt` callback.

### RS256 Algorithm (Optional)

NextAuth v5 mặc định sử dụng HS256. Để sử dụng RS256, cần custom implementation trong `jwt` callback hoặc sử dụng custom JWT library.

## Testing JWT

### 1. Kiểm tra token trong browser

```javascript
// Console browser
document.cookie.split(';').find(c => c.includes('next-auth'))
```

### 2. Decode JWT token

Sử dụng [jwt.io](https://jwt.io) để decode và inspect token.

### 3. Verify token trong code

```typescript
import { decode } from "next-auth/jwt"

const token = await decode({
  token: jwtToken,
  secret: process.env.NEXTAUTH_SECRET,
})
```

## Troubleshooting

### Token quá lớn

**Vấn đề**: Token vượt quá giới hạn size (~8KB)

**Giải pháp**:
- Giảm số lượng permissions/roles trong token
- Chỉ lưu permission IDs thay vì full objects
- Lazy load permissions từ database

### Token không được refresh

**Vấn đề**: Permissions/roles không được cập nhật sau khi thay đổi

**Giải pháp**:
```typescript
// Force update session
import { useSession } from "next-auth/react"

const { data: session, update } = useSession()

// Update session
await update()
```

### Secret key issues

**Vấn đề**: Lỗi "Invalid secret" hoặc "Secret not set"

**Giải pháp**:
- Kiểm tra `NEXTAUTH_SECRET` đã được set chưa
- Đảm bảo secret đủ mạnh (ít nhất 32 ký tự)
- Restart server sau khi thay đổi secret

## Migration từ Database Session

Nếu đang dùng database session và muốn chuyển sang JWT:

1. ✅ Remove PrismaAdapter (đã được comment trong code)
2. ✅ Set `strategy: "jwt"` (đã được set)
3. ✅ Cập nhật JWT callbacks (đã được cập nhật)
4. ✅ Test thoroughly

## References

- [NextAuth.js JWT Documentation](https://next-auth.js.org/configuration/options#jwt)
- [JWT.io - Decode JWT tokens](https://jwt.io)
- [NextAuth.js v5 Beta Docs](https://authjs.dev)

