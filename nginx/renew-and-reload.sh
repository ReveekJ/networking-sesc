#!/bin/sh

# Скрипт для обновления сертификатов и перезагрузки nginx
# Можно запускать вручную или через cron

set -e

echo "### Проверка обновления SSL сертификатов..."

# Обновляем сертификаты
docker-compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot

# Перезагружаем nginx если сертификаты были обновлены
if [ $? -eq 0 ]; then
  echo "### Перезагрузка nginx..."
  docker-compose exec nginx nginx -s reload
  echo "### Готово!"
else
  echo "### Сертификаты не требуют обновления или произошла ошибка."
fi

