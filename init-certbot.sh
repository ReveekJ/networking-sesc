#!/bin/bash

# Script to automatically obtain SSL certificates after docker-compose up
# This script should be run after docker-compose up if CERTBOT_AUTO=1

set -e

CERTBOT_AUTO="${CERTBOT_AUTO:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@networking-sesc.ru}"
CERTBOT_STAGING="${CERTBOT_STAGING:-0}"

if [ "$CERTBOT_AUTO" != "1" ]; then
    echo "CERTBOT_AUTO is not enabled. Set CERTBOT_AUTO=1 to use automatic certificate obtaining."
    exit 0
fi

echo "=== Automatic SSL Certificate Setup ==="
echo "Email: $CERTBOT_EMAIL"
echo "Staging mode: $CERTBOT_STAGING"
echo

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
for i in {1..60}; do
    if docker-compose ps nginx | grep -q "Up" && \
       curl -f http://localhost/.well-known/acme-challenge/test >/dev/null 2>&1 2>/dev/null || [ $i -eq 60 ]; then
        break
    fi
    sleep 1
done

# Check if certificates already exist
if docker-compose exec -T nginx test -f /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem 2>/dev/null; then
    echo "SSL certificates already exist. Skipping certificate obtaining."
    echo "Reloading nginx to use SSL configuration..."
    docker-compose exec nginx nginx -s reload || docker-compose restart nginx
    exit 0
fi

# Prepare domain arguments
domain_args="-d networking-sesc.ru -d www.networking-sesc.ru"

# Prepare staging flag
if [ "$CERTBOT_STAGING" = "1" ]; then
    staging_flag="--staging"
    echo "Using Let's Encrypt STAGING environment (for testing)"
else
    staging_flag=""
    echo "Using Let's Encrypt PRODUCTION environment"
fi

echo "Attempting to obtain SSL certificates..."
echo

# Try to get certificates
if docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    $domain_args \
    --email "$CERTBOT_EMAIL" \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal \
    $staging_flag; then
    
    echo
    echo "=== Certificates obtained successfully! ==="
    
    # Check if certificates are now available in nginx container
    if docker-compose exec -T nginx test -f /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem 2>/dev/null; then
        echo "Switching nginx to SSL configuration..."
        docker-compose exec nginx nginx -s reload || docker-compose restart nginx
        echo
        echo "=== SSL is now active! ==="
        echo "Your site should now be accessible via HTTPS: https://networking-sesc.ru"
    else
        echo "Warning: Certificates obtained but not found in nginx container."
        echo "Restarting nginx..."
        docker-compose restart nginx
    fi
else
    echo
    echo "=== Failed to obtain certificates automatically ==="
    echo "Possible reasons:"
    echo "1. DNS records are not configured or not propagated"
    echo "2. Ports 80 and 443 are not accessible from the internet"
    echo "3. Domain is not accessible"
    echo
    echo "You can obtain certificates manually later:"
    echo "  docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d networking-sesc.ru -d www.networking-sesc.ru"
    echo
    echo "Nginx will continue running with HTTP-only configuration."
    exit 1
fi

