# Система опросов

Система для проведения интерактивных опросов. Любой пользователь может создавать опросы и участвовать в них без авторизации.

## Технологический стек

- **Backend**: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **Frontend**: React, Vite
- **Инфраструктура**: Docker Compose, Traefik, Nginx

## Структура проекта

```
.
├── backend/          # FastAPI приложение
├── frontend/         # React приложение
├── traefik/          # Конфигурация Traefik
└── docker-compose.yml
```

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Git

### Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd networking-sesc
```

2. Создайте файл `.env` в корне проекта:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/survey_db

# Application
APP_NAME=Survey System
DEBUG=True

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Domain (для Traefik)
DOMAIN=localhost
ACME_EMAIL=admin@example.com

# Frontend environment
VITE_API_BASE_URL=http://localhost:8000
```

3. Запустите проект:
```bash
docker-compose up -d
```

4. Примените миграции (если нужно):
```bash
docker-compose exec backend alembic upgrade head
```

5. Откройте в браузере:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Traefik Dashboard: http://localhost:8080

## Использование

### Создание и управление опросами

1. Откройте http://localhost:3000
2. Создайте новый опрос (авторизация не требуется)
3. Получите пригласительную ссылку и QR код
4. Управляйте этапами опроса:
   - Начать опрос
   - Переключение этапов (Вопрос → Голосование → Результаты)
   - Отслеживание статусов команд в реальном времени

### Для команд

1. Перейдите по пригласительной ссылке или отсканируйте QR код
2. Зарегистрируйте команду:
   - Введите название команды
   - Добавьте участников (динамическое количество)
   - Заполните данные каждого участника
3. Пройдите опрос:
   - **Вопрос**: Предложите варианты ответов
   - **Голосование**: Выберите один или несколько вариантов
   - **Результаты**: Просмотрите статистику

## API Endpoints

### API для управления опросами

- `POST /api/admin/surveys` - Создать опрос
- `GET /api/admin/surveys/{survey_id}` - Получить опрос
- `POST /api/admin/surveys/{survey_id}/start` - Начать опрос
- `POST /api/admin/surveys/{survey_id}/next-stage` - Следующий этап
- `GET /api/admin/surveys/{survey_id}/status` - Статус опроса
- `GET /api/admin/surveys/{survey_id}/results` - Результаты опроса
- `GET /api/admin/surveys/{survey_id}/teams` - Список команд

### API для команд

- `POST /api/teams/register` - Регистрация команды
- `GET /api/teams/survey/{invite_code}` - Информация об опросе
- `POST /api/teams/teams/{team_id}/answers` - Отправить ответы
- `POST /api/teams/teams/{team_id}/votes` - Отправить голоса
- `GET /api/teams/teams/{team_id}/status` - Статус команды
- `GET /api/teams/teams/{team_id}/available-answers` - Варианты для голосования

## Настройка Traefik для продакшена

Для использования с реальным доменом и SSL:

1. Установите переменную окружения `DOMAIN`:
```bash
DOMAIN=yourdomain.com
```

2. Установите email для Let's Encrypt:
```bash
ACME_EMAIL=your-email@example.com
```

3. Traefik автоматически получит SSL сертификат через Let's Encrypt

## Разработка

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Миграции

```bash
# Создать новую миграцию
docker-compose exec backend alembic revision --autogenerate -m "description"

# Применить миграции
docker-compose exec backend alembic upgrade head

# Откатить миграцию
docker-compose exec backend alembic downgrade -1
```

## Переменные окружения

### Backend

- `DATABASE_URL` - URL подключения к PostgreSQL
- `FRONTEND_URL` - URL фронтенда для CORS
- `DEBUG` - Режим отладки

### Frontend

- `VITE_API_BASE_URL` - URL API бэкенда

## Структура базы данных

- **surveys** - Опросы
- **teams** - Команды
- **participants** - Участники команд
- **questions** - Вопросы опроса
- **answers** - Ответы команд
- **votes** - Голоса команд

## Лицензия

MIT

