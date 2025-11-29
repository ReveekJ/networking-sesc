# Настройка SSL через Certbot в Docker Compose

Эта директория содержит конфигурацию nginx и скрипты для автоматического получения и обновления SSL сертификатов через Let's Encrypt.

## Быстрый старт

### 1. Настройте DNS записи

Убедитесь, что домены `networking-sesc.ru` и `www.networking-sesc.ru` указывают на IP вашего сервера:

```
A     networking-sesc.ru      -> YOUR_SERVER_IP
A     www.networking-sesc.ru  -> YOUR_SERVER_IP
```

### 2. Запустите сервисы (без SSL)

**Важно**: Для первого запуска используйте начальную конфигурацию без SSL:

```bash
# Используйте начальную конфигурацию без HTTPS
cp nginx/nginx-init.conf nginx/nginx.conf

# Запустите сервисы
docker-compose up -d
```

Проверьте, что nginx запустился:
```bash
docker-compose ps nginx
```

### 3. Получите SSL сертификаты

#### Вариант A: Простой скрипт (рекомендуется)

```bash
# Установите email для Let's Encrypt (опционально)
export CERTBOT_EMAIL=your-email@example.com

# Для тестирования используйте staging режим
export CERTBOT_STAGING=1

# Получите сертификаты
./nginx/obtain-cert.sh

# Для production уберите staging
export CERTBOT_STAGING=0
./nginx/obtain-cert.sh
```

#### Вариант B: Через docker-compose напрямую

```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d networking-sesc.ru \
  -d www.networking-sesc.ru \
  --email your-email@example.com \
  --rsa-key-size 4096 \
  --agree-tos \
  --non-interactive

# Перезагрузите nginx
docker-compose exec nginx nginx -s reload
```

### 4. Переключитесь на конфигурацию с SSL

После успешного получения сертификатов скрипт автоматически обновит конфигурацию nginx. Если этого не произошло, сделайте вручную:

```bash
# Убедитесь, что используете конфигурацию с SSL
cp nginx/nginx.conf nginx/nginx.conf.backup  # резервная копия
# Конфигурация уже должна быть обновлена скриптом

# Перезагрузите nginx
docker-compose exec nginx nginx -s reload
```

### 5. Проверьте работу

После получения сертификатов nginx автоматически начнет обслуживать HTTPS трафик. Проверьте:

```bash
curl -I https://networking-sesc.ru
```

Вы должны увидеть редирект с HTTP на HTTPS при обращении к `http://networking-sesc.ru`.

## Автоматическое обновление

Сертификаты автоматически обновляются каждые 12 часов через контейнер `certbot` в docker-compose. 

**Важно**: После автоматического обновления сертификатов нужно перезагрузить nginx:

```bash
docker-compose exec nginx nginx -s reload
```

Или используйте скрипт для автоматической проверки и перезагрузки:

```bash
./nginx/renew-and-reload.sh
```

Для автоматизации можно добавить в cron на хосте:

```bash
# Добавьте в crontab (crontab -e)
0 3 * * * cd /path/to/project && ./nginx/renew-and-reload.sh >> /var/log/certbot-renew.log 2>&1
```

## Структура файлов

- `nginx.conf` - основная конфигурация nginx с SSL (используется после получения сертификатов)
- `nginx-init.conf` - начальная конфигурация без SSL (для первого запуска)
- `nginx-ssl.conf` - шаблон конфигурации с SSL
- `Dockerfile` - образ nginx
- `obtain-cert.sh` - скрипт для получения сертификатов
- `init-letsencrypt.sh` - расширенный скрипт инициализации (альтернатива)

## Переменные окружения

Вы можете настроить получение сертификатов через переменные окружения:

- `CERTBOT_EMAIL` - email для Let's Encrypt (по умолчанию: admin@networking-sesc.ru)
- `CERTBOT_STAGING` - использовать staging окружение для тестирования (по умолчанию: 0)

## Troubleshooting

### Проблема: nginx не запускается из-за отсутствия сертификатов

**Решение**: Используйте начальную конфигурацию без SSL:

```bash
cp nginx/nginx-init.conf nginx/nginx.conf
docker-compose restart nginx
```

После получения сертификатов через `./nginx/obtain-cert.sh` конфигурация автоматически обновится на версию с SSL.

### Проблема: certbot не может получить сертификат

**Причины**:
1. DNS записи не настроены или не распространились
2. Порты 80 и 443 не открыты на сервере
3. Домен не доступен из интернета

**Решение**:
- Проверьте DNS: `dig networking-sesc.ru`
- Проверьте доступность портов: `nc -zv YOUR_SERVER_IP 80`
- Используйте staging режим для тестирования: `export CERTBOT_STAGING=1`

### Проблема: Сертификаты не обновляются

**Решение**: Проверьте логи certbot контейнера:

```bash
docker-compose logs certbot
```

### Ручное обновление сертификатов

```bash
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

## Безопасность

- Сертификаты хранятся в Docker volume `certbot_data`
- Приватные ключи никогда не должны попадать в git
- Используйте production режим только после проверки в staging

