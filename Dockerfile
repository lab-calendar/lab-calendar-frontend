FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty base URL so axios calls hit the same origin, which nginx
# reverse-proxies to the backend in production (see backend repo's
# deploy/nginx/nginx.conf).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build
# The MSW worker script lives in public/ so the dev server can serve it, which
# means the build copies it into dist/. It must never reach production: a stray
# service worker there could intercept real API calls. The mock code itself is
# already gone (import.meta.env.DEV is false), so this is only the leftover file.
RUN rm -f dist/mockServiceWorker.js

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
