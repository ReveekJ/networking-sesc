# Автоматическая настройка SSL через Certbot

Эта система автоматически настраивает SSL сертификаты при запуске `docker-compose up --build`.

## Быстрый старт

### Вариант 1: Полностью автоматический (рекомендуется)

1. **Настройте DNS записи** для домена `networking-sesc.ru` и `www.networking-sesc.ru`:
   ```
   A     networking-sesc.ru      -> YOUR_SERVER_IP
   A     www.networking-sesc.ru  -> YOUR_SERVER_IP
   ```

2. **Запустите с автоматическим получением сертификатов**:
   ```bash
   CERTBOT_AUTO=1 CERTBOT_EMAIL=your-email@example.com docker-compose up --build -d
   
   # После запуска выполните скрипт для получения сертификатов
   ./init-certbot.sh
   ```

   Или создайте `.env` файл:
   ```bash
   CERTBOT_AUTO=1
   CERTBOT_EMAIL=your-email@example.com
   CERTBOT_STAGING=0  # Используйте 1 для тестирования
   ```

   Затем:
   ```bash
   docker-compose up --build -d
   ./init-certbot.sh
   ```

### Вариант 2: Ручное получение сертификатов

Если вы не хотите использовать автоматическое получение:

```bash
# Запустите сервисы
docker-compose up --build -d

# Получите сертификаты вручную
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d networking-sesc.ru \
  -d www.networking-sesc.ru \
  --email your-email@example.com \
  --rsa-key-size 4096 \
  --agree-tos \
  --non-interactive

# Перезагрузите nginx для использования SSL
docker-compose restart nginx
```

## Как это работает

1. **При первом запуске** (без сертификатов):
   - Nginx запускается с HTTP-only конфигурацией
   - Приложение доступно по HTTP на порту 80
   - Let's Encrypt challenges доступны через `/.well-known/acme-challenge/`

2. **После получения сертификатов**:
   - Скрипт `init-certbot.sh` получает сертификаты через certbot
   - Nginx автоматически переключается на SSL конфигурацию
   - HTTP трафик автоматически редиректится на HTTPS

3. **Автоматическое обновление**:
   - Контейнер `certbot` автоматически обновляет сертификаты каждые 12 часов
   - После обновления nginx автоматически перезагружается

## Переменные окружения

- `CERTBOT_AUTO` - Включить автоматическое получение сертификатов (0 или 1)
- `CERTBOT_EMAIL` - Email для Let's Encrypt уведомлений
- `CERTBOT_STAGING` - Использовать staging окружение для тестирования (0 или 1)

## Troubleshooting

### Nginx не переключается на SSL

Если сертификаты получены, но nginx не переключается на SSL:

```bash
# Проверьте наличие сертификатов
docker-compose exec nginx ls -la /etc/letsencrypt/live/networking-sesc.ru/

# Перезагрузите nginx вручную
docker-compose restart nginx
```

### Ошибка при получении сертификатов

1. **Проверьте DNS**:
   ```bash
   dig networking-sesc.ru
   ```

2. **Проверьте доступность портов**:
   ```bash
   nc -zv YOUR_SERVER_IP 80
   nc -zv YOUR_SERVER_IP 443
   ```

3. **Используйте staging режим для тестирования**:
   ```bash
   CERTBOT_STAGING=1 ./init-certbot.sh
   ```

### Ручное обновление сертификатов

```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## Структура файлов

- `nginx/docker-entrypoint.sh` - Скрипт запуска nginx, проверяет наличие сертификатов
- `nginx/nginx-init.conf` - HTTP-only конфигурация (используется до получения сертификатов)
- `nginx/nginx.conf` - SSL конфигурация (используется после получения сертификатов)
- `init-certbot.sh` - Скрипт для автоматического получения сертификатов

## Безопасность

- Сертификаты хранятся в Docker volume `certbot_data`
- Приватные ключи никогда не попадают в git
- Используйте staging режим для тестирования перед production

