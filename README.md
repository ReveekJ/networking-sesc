# Quiz System

Система для создания и проведения квизов с синхронным режимом прохождения.

## Технологии

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, WebSocket
- **Frontend**: React, TypeScript, React Router
- **Infrastructure**: Docker, Docker Compose, Poetry

## Установка и запуск

### Требования

- Docker и Docker Compose
- Poetry (для локальной разработки backend)

### Запуск через Docker Compose

#### Автоматический запуск с SSL (рекомендуется для production)

1. Клонируйте репозиторий
2. Настройте DNS записи для домена `networking-sesc.ru`
3. Запустите с автоматической настройкой SSL:

```bash
CERTBOT_AUTO=1 CERTBOT_EMAIL=your-email@example.com ./start.sh --build
```

Или создайте `.env` файл:
```bash
CERTBOT_AUTO=1
CERTBOT_EMAIL=your-email@example.com
CERTBOT_STAGING=0  # Используйте 1 для тестирования
```

Затем:
```bash
./start.sh --build
```

#### Стандартный запуск (для разработки)

```bash
docker-compose up --build
```

Сервисы будут доступны:
- Frontend: http://localhost:3000 (или https://networking-sesc.ru с SSL)
- Backend API: http://localhost:8000 (или https://networking-sesc.ru/api с SSL)
- PostgreSQL: localhost:5432

**Примечание**: Для production с SSL см. [README-SSL.md](README-SSL.md)

### Локальная разработка

#### Backend

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## Использование

1. **Создание квиза**: Перейдите на главную страницу и создайте квиз с вопросами
2. **Регистрация команд**: Поделитесь ссылкой-приглашением или QR кодом
3. **Запуск квиза**: Хост запускает квиз и управляет переходами между вопросами
4. **Прохождение квиза**: Участники отвечают на вопросы синхронно
5. **Статистика**: После завершения доступна статистика по последнему вопросу

## Структура проекта

```
.
├── backend/          # FastAPI приложение
│   ├── app/
│   │   ├── models/  # SQLAlchemy модели
│   │   ├── schemas/ # Pydantic схемы
│   │   ├── routers/ # API роутеры
│   │   ├── services/# Бизнес-логика
│   │   └── websocket/# WebSocket обработчики
│   └── alembic/     # Миграции БД
├── frontend/        # React приложение
│   └── src/
│       ├── pages/   # Страницы приложения
│       ├── components/# React компоненты
│       └── services/# API клиенты
└── docker-compose.yml
```

## API Endpoints

- `POST /api/quizzes` - создание квиза
- `GET /api/quizzes/{invite_code}` - получение квиза
- `POST /api/quizzes/{invite_code}/teams` - регистрация команды
- `GET /api/quizzes/{invite_code}/teams` - список команд
- `POST /api/quizzes/{invite_code}/start` - запуск квиза
- `GET /api/quizzes/{invite_code}/current-question` - текущий вопрос
- `POST /api/quizzes/{invite_code}/next-question` - следующий вопрос
- `POST /api/quizzes/{invite_code}/answers` - отправка ответа
- `GET /api/quizzes/{invite_code}/statistics` - статистика
- `WS /ws/{invite_code}` - WebSocket для синхронизации

## Особенности

- Адаптивный дизайн для мобильных устройств
- Синхронный режим прохождения через WebSocket
- Генерация QR кодов для быстрого присоединения
- Статистика по результатам мультивыбора
- Бело-зеленая цветовая схема
