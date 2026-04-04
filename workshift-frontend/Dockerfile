### Frontend image (React/Vite build -> Nginx serve dist)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

