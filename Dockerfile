FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY addin/package.json addin/
COPY packages/core/package.json packages/core/
RUN npm ci --no-audit --no-fund
COPY packages packages
COPY addin addin
RUN npm run build -w addin

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/addin/dist /usr/share/nginx/html
