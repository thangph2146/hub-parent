# Security Best Practices

## ⚠️ Quan trọng về Bảo mật

Dự án này chứa nhiều thông tin nhạy cảm cần được bảo vệ. Hãy tuân thủ các quy tắc sau:

## 🔒 Environment Variables

### Các biến NGUY HIỂM không được commit vào git:

1. **DATABASE_URL**
   - Chứa username và password của database
   - Format: `postgresql://user:password@host:port/database`

2. **NEXTAUTH_SECRET**
   - Secret key để sign và verify JWT tokens
   - Nếu bị lộ, attacker có thể tạo fake tokens
   - Phải có ít nhất 32 ký tự

3. **GOOGLE_CLIENT_SECRET**
   - OAuth secret từ Google Cloud Console
   - Nếu bị lộ, attacker có thể giả mạo OAuth flow

4. **Các API Keys và Tokens khác**
   - Tất cả API keys, access tokens, service account keys

### Checklist Bảo mật:

- ✅ `docs/env.md` chỉ chứa placeholders, không có giá trị thực
- ✅ File `.env.local` được ignore trong `.gitignore`
- ✅ Không commit bất kỳ file `.env*` nào có chứa secrets
- ✅ Sử dụng secrets khác nhau cho mỗi environment (dev/staging/prod)
- ✅ Rotate secrets định kỳ (khuyến nghị 3-6 tháng một lần)

## 🛡️ Secret Management

### Tạo Secret mạnh:

```bash
# Tạo NEXTAUTH_SECRET
openssl rand -base64 32

# Tạo random password
openssl rand -hex 16
```

### Lưu trữ Secrets:

1. **Local Development**: `.env.local` (đã được ignore)
2. **Staging/Production**: 
   - Vercel Environment Variables
   - AWS Secrets Manager
   - GitHub Secrets (cho CI/CD)
   - Other secure secret management services

### ⚠️ Nếu đã commit secrets vào git:

1. **Ngay lập tức**:
   ```bash
   # Rotate tất cả secrets đã commit
   # - Tạo secret mới cho NEXTAUTH_SECRET
   # - Tạo OAuth client mới trong Google Cloud
   # - Đổi password database
   ```

2. **Xóa secrets khỏi git history** (nếu có thể):
   ```bash
   # Cảnh báo: Chỉ làm nếu repository chưa được push public
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch docs/env.md" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (cẩn thận!):
   ```bash
   git push origin --force --all
   ```

## 🔐 JWT Security

### Best Practices:

1. **Secret Key**:
   - Sử dụng secret mạnh (min 32 chars)
   - Không hardcode trong code
   - Rotate định kỳ

2. **Token Expiration**:
   - Đặt maxAge hợp lý (hiện tại: 7 ngày)
   - Implement refresh token nếu cần

3. **HTTPS Only**:
   - Luôn sử dụng HTTPS trong production
   - Cookies phải có `secure: true` flag

## 🌐 Database Security

### Best Practices:

1. **Connection String**:
   - Không commit DATABASE_URL vào git
   - Sử dụng connection pooling
   - Enable SSL/TLS (sslmode=require)

2. **Access Control**:
   - Tạo user riêng với minimal privileges
   - Sử dụng read-only user khi có thể
   - Enable IP whitelist nếu có thể

## 📝 Code Review Checklist

Trước khi merge PR, đảm bảo:

- [ ] Không có hardcoded secrets trong code
- [ ] Không có real secrets trong test files
- [ ] Không có credentials trong commit messages
- [ ] File `.env*` đã được ignore
- [ ] `docs/env.md` chỉ có placeholders

## 🚨 Incident Response

Nếu phát hiện secret bị lộ:

1. **Ngay lập tức**:
   - Rotate secret bị lộ
   - Kiểm tra logs cho suspicious activities
   - Revoke tokens/keys nếu có thể

2. **Báo cáo**:
   - Thông báo team lead
   - Document incident
   - Review và cải thiện process

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

