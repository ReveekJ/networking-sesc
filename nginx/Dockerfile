FROM nginx:alpine

# Install bash, curl and openssl for scripts
RUN apk add --no-cache bash curl openssl

# Copy configuration files
COPY nginx-init.conf /etc/nginx/conf.d/default-init.conf
COPY nginx.conf /etc/nginx/conf.d/default-ssl.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Create directories for certbot webroot
RUN mkdir -p /var/www/certbot && \
    chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 443

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
