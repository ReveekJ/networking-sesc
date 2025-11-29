#!/bin/bash
set -e

CERT_PATH="/etc/letsencrypt/live/networking-sesc.ru/fullchain.pem"
INIT_CONFIG="/etc/nginx/conf.d/default-init.conf"
SSL_CONFIG="/etc/nginx/conf.d/default-ssl.conf"
NGINX_CONFIG="/etc/nginx/conf.d/default.conf"

# Function to check if certificates exist
check_certificates() {
    [ -f "$CERT_PATH" ]
}

# Function to switch to SSL configuration
switch_to_ssl() {
    echo "Switching to SSL configuration..."
    cp "$SSL_CONFIG" "$NGINX_CONFIG"
    nginx -t && nginx -s reload
    echo "SSL configuration activated!"
}

# Function to use HTTP-only configuration
use_http_only() {
    echo "Using HTTP-only configuration (no SSL certificates found)..."
    cp "$INIT_CONFIG" "$NGINX_CONFIG"
}

# Check certificates on startup
if check_certificates; then
    echo "SSL certificates found, using SSL configuration..."
    switch_to_ssl
else
    echo "No SSL certificates found, using HTTP-only configuration..."
    use_http_only
    
    # Start nginx in background to allow certbot to work
    nginx -g "daemon on;"
    
    # Wait a bit for nginx to start
    sleep 2
    
    # Note: Automatic certificate obtaining is handled by a separate init script
    # that runs after docker-compose up. This is because certbot runs in a separate container.
    # If CERTBOT_AUTO is set, the init script will obtain certificates and restart nginx.
    if [ "${CERTBOT_AUTO:-0}" = "1" ]; then
        echo "CERTBOT_AUTO is enabled. Waiting for certificates to be obtained..."
        echo "Certificates will be obtained by the init-certbot.sh script."
        echo "You can also obtain them manually: docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d networking-sesc.ru -d www.networking-sesc.ru"
    fi
    
    # Switch to foreground mode
    nginx -s quit
    exec nginx -g "daemon off;"
fi

# Execute main command
exec "$@"

