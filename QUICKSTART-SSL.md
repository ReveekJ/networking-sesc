# Быстрый старт с автоматическим SSL

## Полностью автоматический запуск

Просто выполните:

```bash
CERTBOT_AUTO=1 CERTBOT_EMAIL=your-email@example.com ./start.sh --build
```

Или используйте `.env` файл:

```bash
# Создайте .env файл
cat > .env << EOF
CERTBOT_AUTO=1
CERTBOT_EMAIL=your-email@example.com
CERTBOT_STAGING=0
EOF

# Запустите
./start.sh --build
```

## Что происходит автоматически:

1. ✅ Запускаются все сервисы (postgres, backend, frontend, nginx)
2. ✅ Nginx запускается с HTTP конфигурацией (если сертификатов нет)
3. ✅ Автоматически получаются SSL сертификаты через Let's Encrypt
4. ✅ Nginx переключается на HTTPS конфигурацию
5. ✅ HTTP трафик автоматически редиректится на HTTPS

## Требования:

- DNS записи настроены для `networking-sesc.ru` и `www.networking-sesc.ru`
- Порты 80 и 443 открыты и доступны из интернета
- Домен указывает на IP вашего сервера

## Проверка:

После запуска проверьте:

```bash
# Проверьте статус сервисов
docker-compose ps

# Проверьте логи nginx
docker-compose logs nginx

# Проверьте наличие сертификатов
docker-compose exec nginx ls -la /etc/letsencrypt/live/networking-sesc.ru/
```

## Доступ к приложению:

- **С SSL**: https://networking-sesc.ru
- **Без SSL** (если сертификаты не получены): http://networking-sesc.ru

## Troubleshooting:

Если сертификаты не получены автоматически:

```bash
# Получите их вручную
./init-certbot.sh

# Или через docker-compose
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d networking-sesc.ru \
  -d www.networking-sesc.ru \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Перезагрузите nginx
docker-compose restart nginx
```

## Дополнительная информация:

См. [README-SSL.md](README-SSL.md) для подробной документации.

