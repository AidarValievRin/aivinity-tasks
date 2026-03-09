# AiVinity Tasks

Комплексная система управления задачами с веб-интерфейсом и Telegram ботом.

## Стек технологий

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Socket.io, JWT
**Frontend:** React 18, Vite, TailwindCSS, Zustand, DnD Kit
**Bot:** Python, aiogram 3
**Infrastructure:** Docker, docker-compose

## Запуск через Docker

```bash
cd taskmanager
docker-compose up --build
```

- Веб-панель: http://localhost:3000
- API: http://localhost:3001
- БД: localhost:5432

## Локальный запуск (разработка)

### Требования
- Node.js 18+
- Python 3.11+
- PostgreSQL 15

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env и установите DATABASE_URL
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173

### Bot

```bash
cd bot
pip install -r requirements.txt
# Установите переменные окружения:
# BOT_TOKEN=7639602148:AAGk9tDQrWE9VgbRgMTO6f0fRp03csAnNpo
# API_URL=http://localhost:3001
python main.py
```

## Структура проекта

```
taskmanager/
├── backend/              # Node.js API
│   ├── prisma/           # Схема БД
│   └── src/
│       ├── routes/       # API роуты
│       ├── middleware/   # JWT авторизация
│       └── lib/          # Prisma клиент
├── frontend/             # React приложение
│   └── src/
│       ├── api/          # HTTP клиенты
│       ├── components/   # UI компоненты
│       ├── pages/        # Страницы
│       └── store/        # Zustand хранилища
├── bot/                  # Telegram бот
│   ├── handlers/         # Обработчики команд
│   └── api/              # Клиент API
├── docker-compose.yml    # Продакшн
└── docker-compose.dev.yml # Разработка
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Tasks (личные)
- `GET /api/tasks/my` - Список задач
- `POST /api/tasks/my` - Создать задачу
- `PUT /api/tasks/my/:id` - Обновить задачу
- `DELETE /api/tasks/my/:id` - Удалить задачу
- `PUT /api/tasks/my/:id/status` - Изменить статус
- `POST /api/tasks/my/:id/comments` - Добавить комментарий

### Tasks (командные)
- Аналогично через `/api/tasks/team/`

### Teams
- `GET /api/teams` - Мои команды
- `POST /api/teams` - Создать команду
- `POST /api/teams/:id/invite` - Пригласить по коду

## Socket.io события

- `task:created` - Задача создана
- `task:updated` - Задача обновлена
- `task:deleted` - Задача удалена
- `comment:added` - Добавлен комментарий

## Telegram бот

Команды:
- `/start` - Приветствие
- `/link` - Привязать аккаунт по коду AIV-XXXX
- `/tasks` - Создать задачу
- `/mytasks` - Просмотр активных задач
- `/help` - Справка
