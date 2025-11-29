#!/bin/bash

# Automated startup script with SSL certificate setup
# Usage: ./start.sh [--build] [--no-ssl]

set -e

BUILD_FLAG=""
NO_SSL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_FLAG="--build"
            shift
            ;;
        --no-ssl)
            NO_SSL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./start.sh [--build] [--no-ssl]"
            exit 1
            ;;
    esac
done

echo "=== Starting Quiz Application ==="
echo

# Check if CERTBOT_AUTO is set
if [ "${CERTBOT_AUTO:-0}" != "1" ] && [ "$NO_SSL" = false ]; then
    echo "CERTBOT_AUTO is not set. SSL certificates will not be obtained automatically."
    echo "To enable automatic SSL setup:"
    echo "  export CERTBOT_AUTO=1"
    echo "  export CERTBOT_EMAIL=your-email@example.com"
    echo "Or run: CERTBOT_AUTO=1 CERTBOT_EMAIL=your@email.com ./start.sh"
    echo
fi

# Start docker-compose
echo "Starting docker-compose..."
docker-compose up $BUILD_FLAG -d

echo
echo "Waiting for services to be ready..."
sleep 5

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Error: Some services failed to start. Check logs: docker-compose logs"
    exit 1
fi

# If SSL auto-setup is enabled, run init script
if [ "${CERTBOT_AUTO:-0}" = "1" ] && [ "$NO_SSL" = false ]; then
    echo
    echo "=== Setting up SSL certificates ==="
    if [ -f "./init-certbot.sh" ]; then
        ./init-certbot.sh
    else
        echo "Warning: init-certbot.sh not found. Skipping SSL setup."
    fi
else
    echo
    echo "SSL auto-setup is disabled."
    echo "To obtain SSL certificates manually, run: ./init-certbot.sh"
fi

echo
echo "=== Application started successfully! ==="
echo
echo "Services status:"
docker-compose ps

echo
if [ "${CERTBOT_AUTO:-0}" = "1" ] && docker-compose exec -T nginx test -f /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem 2>/dev/null; then
    echo "✓ SSL certificates are configured"
    echo "  Access your application at: https://networking-sesc.ru"
else
    echo "⚠ SSL certificates are not configured"
    echo "  Access your application at: http://networking-sesc.ru"
    echo "  To set up SSL, run: ./init-certbot.sh"
fi

