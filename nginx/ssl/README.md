# SSL Certificates Directory

This directory contains SSL certificates for the nginx reverse proxy.

## Required Files

- `fullchain.pem` - Full certificate chain (certificate + intermediate certificates)
- `privkey.pem` - Private key for the certificate

## Obtaining SSL Certificates

### Option 1: Let's Encrypt (Recommended)

1. Install certbot on your host machine:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. Stop nginx container temporarily:
   ```bash
   docker-compose stop nginx
   ```

3. Obtain certificate:
   ```bash
   sudo certbot certonly --standalone -d networking-sesc.ru -d www.networking-sesc.ru
   ```

4. Copy certificates to this directory:
   ```bash
   sudo cp /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem nginx/ssl/
   sudo cp /etc/letsencrypt/live/networking-sesc.ru/privkey.pem nginx/ssl/
   sudo chown $USER:$USER nginx/ssl/*.pem
   ```

5. Restart nginx:
   ```bash
   docker-compose up -d nginx
   ```

### Option 2: Manual Certificate

1. Place your `fullchain.pem` and `privkey.pem` files in this directory
2. Ensure proper permissions:
   ```bash
   chmod 644 nginx/ssl/fullchain.pem
   chmod 600 nginx/ssl/privkey.pem
   ```

## Certificate Renewal

For Let's Encrypt certificates, set up automatic renewal:

```bash
sudo certbot renew --dry-run
```

Add to crontab:
```bash
0 0 * * * certbot renew --quiet && docker cp /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem quiz_nginx:/etc/nginx/ssl/ && docker cp /etc/letsencrypt/live/networking-sesc.ru/privkey.pem quiz_nginx:/etc/nginx/ssl/ && docker exec quiz_nginx nginx -s reload
```

## Security Note

**DO NOT commit actual certificate files to git!** This directory should only contain placeholder files or documentation.

