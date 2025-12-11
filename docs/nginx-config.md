# Nginx Configuration cho NextAuth

## Vấn đề

Khi có reverse proxy (nginx), NextAuth có thể nhận Host header từ client request thay vì domain thực tế. Điều này dẫn đến:
- OAuth redirect URI sai domain
- Redirect sau callback về domain sai
- Lỗi Configuration

## Giải pháp

Cập nhật nginx config để đảm bảo Host header và forwarded headers đúng:

```nginx
server {
    server_name chame.hub.edu.vn;

    location / {
        proxy_pass http://localhost:3000;
        
        # QUAN TRỌNG: Set Host header thành server_name thay vì $host
        # Điều này đảm bảo NextAuth luôn nhận đúng domain
        proxy_set_header Host chame.hub.edu.vn;
        
        # Set X-Forwarded-Host để NextAuth biết domain thực tế
        proxy_set_header X-Forwarded-Host chame.hub.edu.vn;
        
        # Các header khác
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Đảm bảo NextAuth có thể verify request
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    location ^~ /api/socket {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # QUAN TRỌNG: Set Host header thành server_name
        proxy_set_header Host chame.hub.edu.vn;
        proxy_set_header X-Forwarded-Host chame.hub.edu.vn;
        
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_buffering off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/chame.hub.edu.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chame.hub.edu.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = chame.hub.edu.vn) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name chame.hub.edu.vn;
    return 404;
}
```

## Thay đổi chính

1. **`proxy_set_header Host chame.hub.edu.vn;`** thay vì `proxy_set_header Host $host;`
   - Đảm bảo NextAuth luôn nhận Host header là `chame.hub.edu.vn`
   - Không phụ thuộc vào Host header từ client request

2. **`proxy_set_header X-Forwarded-Host chame.hub.edu.vn;`**
   - Thêm header này để NextAuth biết domain thực tế
   - Hữu ích khi có nhiều reverse proxy layers

## Sau khi cập nhật

1. Test nginx config:
```bash
sudo nginx -t
```

2. Reload nginx:
```bash
sudo systemctl reload nginx
```

3. Kiểm tra logs của Next.js app để xem Host header:
- "NextAuth request" log sẽ hiển thị `requestHost`
- Nếu đúng, sẽ thấy `requestHost: "chame.hub.edu.vn"`

## Lưu ý

- Nếu có reverse proxy khác ở phía trước nginx (ví dụ: Cloudflare), có thể cần cấu hình thêm
- Đảm bảo `NEXTAUTH_URL` trong environment variables là `https://chame.hub.edu.vn` (không có dấu / ở cuối)

