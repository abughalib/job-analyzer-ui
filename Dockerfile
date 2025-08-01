FROM node:24-bookworm AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM httpd:2-bookworm

RUN rm -rf /usr/local/apache2/htdocs/*
COPY --from=builder /app/dist/job-analyzer/browser/ /usr/local/apache2/htdocs/

EXPOSE 80
