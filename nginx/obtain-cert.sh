#!/bin/sh

# Скрипт для получения SSL сертификатов через certbot в docker-compose

set -e

domains="networking-sesc.ru www.networking-sesc.ru"
email="${CERTBOT_EMAIL:-admin@networking-sesc.ru}"
staging="${CERTBOT_STAGING:-0}"

echo "### Получение SSL сертификатов для доменов: $domains"
echo "### Email: $email"
if [ "$staging" = "1" ]; then
  echo "### Режим: STAGING (тестовый)"
else
  echo "### Режим: PRODUCTION"
fi
echo

# Проверяем, что nginx запущен
if ! docker-compose ps nginx | grep -q "Up"; then
  echo "### Ошибка: nginx не запущен. Запустите сначала: docker-compose up -d nginx"
  exit 1
fi

# Объединяем домены в одну строку для certbot
domain_args=""
for domain in $domains; do
  domain_args="$domain_args -d $domain"
done

# Выбираем между staging и production окружением
if [ "$staging" != "0" ]; then 
  staging_arg="--staging"
else
  staging_arg=""
fi

# Получаем сертификат используя webroot плагин
echo "### Запрос сертификатов у Let's Encrypt..."
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  $staging_arg \
  $domain_args \
  --email "$email" \
  --rsa-key-size 4096 \
  --agree-tos \
  --non-interactive \
  --force-renewal

if [ $? -eq 0 ]; then
  echo
  echo "### Сертификаты успешно получены!"
  
  # Проверяем наличие сертификатов
  echo "### Проверка наличия сертификатов..."
  if docker-compose exec -T nginx test -f /etc/letsencrypt/live/networking-sesc.ru/fullchain.pem; then
    echo "### Сертификаты найдены в контейнере nginx."
    
    # Проверяем, используется ли конфигурация с SSL
    if ! docker-compose exec -T nginx grep -q "ssl_certificate /etc/letsencrypt" /etc/nginx/conf.d/default.conf 2>/dev/null; then
      echo "### Внимание: Используется конфигурация без SSL."
      echo "### Замените nginx-init.conf на nginx.conf и перезапустите nginx:"
      echo "###   cp nginx/nginx.conf nginx/nginx.conf.backup"
      echo "###   # Убедитесь, что nginx.conf содержит SSL конфигурацию"
      echo "###   docker-compose restart nginx"
    else
      echo "### Конфигурация с SSL уже активна."
      echo "### Перезагрузка nginx..."
      docker-compose exec nginx nginx -s reload || docker-compose restart nginx
      echo "### Готово! HTTPS теперь активен."
    fi
  else
    echo "### Предупреждение: Сертификаты получены, но не найдены в контейнере nginx."
    echo "### Перезапустите nginx: docker-compose restart nginx"
  fi
else
  echo "### Ошибка при получении сертификатов. Проверьте логи выше."
  exit 1
fi

