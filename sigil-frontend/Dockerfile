# Build stage
FROM node:25-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL=http://localhost:8081
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm build

FROM ghcr.io/static-web-server/static-web-server:2-alpine AS sws

FROM gcr.io/distroless/cc:nonroot
COPY --from=sws /usr/local/bin/static-web-server /
COPY --from=builder /app/dist /public
USER nonroot:nonroot
EXPOSE 5173
ENTRYPOINT ["/static-web-server", "--port", "5173", "--root", "/public", "--page-fallback", "/public/index.html"]
