# Nginx Deployment Configuration

This configuration serves the frontend static files and proxies **only** `GET /files/{id}` requests to the backend for viewing uploaded images. File uploads (`POST /files/`) are not exposed, keeping that endpoint secure.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend static files
    location / {
        root /path/to/sigil-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy ONLY GET requests to /files/{uuid}
    location ~ ^/files/[a-f0-9-]{36}$ {
        # Only allow GET method
        limit_except GET {
            deny all;
        }

        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Pass cookies for authentication
        proxy_pass_request_headers on;
        proxy_cookie_path / /;
    }
}
```

**Why this works:**
- Frontend makes API calls with full URL (`VITE_API_URL`) for uploads
- Images in markdown use relative URLs (`/files/{id}`)
- Nginx proxies GET requests for images
- Upload endpoint stays internal and secure
