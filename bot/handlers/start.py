from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from api.client import get_user_by_telegram, get_my_tasks

router = Router()

PRIORITY_LABELS = {
    "low": "Низкий",
    "medium": "Средний",
    "high": "Высокий",
    "urgent": "Срочно",
}

STATUS_LABELS = {
    "todo": "Новая",
    "in_progress": "В работе",
    "on_hold": "Приостановлена",
    "stuck": "Зависла",
    "cancelled": "Отменена",
    "done": "Выполнена",
}


@router.message(Command("start"))
async def cmd_start(message: Message):
    user = await get_user_by_telegram(str(message.from_user.id))

    if user:
        await message.answer(
            f"Добро пожаловать, {user['username']}!\n\n"
            "Доступные команды:\n"
            "/tasks - Добавить новую задачу\n"
            "/mytasks - Мои активные задачи\n"
            "/link - Привязать аккаунт\n"
            "/help - Помощь"
        )
    else:
        await message.answer(
            "Добро пожаловать в AiVinity Tasks!\n\n"
            "Для начала работы привяжите ваш аккаунт:\n"
            "1. Откройте веб-панель AiVinity Tasks\n"
            "2. Перейдите в Профиль\n"
            "3. Скопируйте ваш уникальный код (AIV-XXXX)\n"
            "4. Отправьте команду /link и введите код\n\n"
            "Команды:\n"
            "/link - Привязать аккаунт\n"
            "/tasks - Добавить задачу\n"
            "/help - Помощь"
        )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Справка по командам:\n\n"
        "/start - Начало работы\n"
        "/link - Привязать Telegram к аккаунту в веб-панели\n"
        "/tasks - Создать новую задачу (личную или командную)\n"
        "/mytasks - Просмотр активных задач\n"
        "/help - Эта справка\n\n"
        "Для полного управления задачами используйте веб-панель."
    )


@router.message(Command("mytasks"))
async def cmd_my_tasks(message: Message):
    user = await get_user_by_telegram(str(message.from_user.id))

    if not user:
        await message.answer(
            "Аккаунт не привязан. Используйте /link для привязки."
        )
        return

    tasks = await get_my_tasks(str(message.from_user.id))

    if not tasks:
        await message.answer("У вас нет активных задач.")
        return

    lines = ["Ваши активные задачи:\n"]
    for i, task in enumerate(tasks[:10], 1):
        status = STATUS_LABELS.get(task["status"], task["status"])
        priority = PRIORITY_LABELS.get(task["priority"], task["priority"])
        due = f" | Срок: {task['dueDate'][:10]}" if task.get("dueDate") else ""
        lines.append(f"{i}. {task['title']}\n   [{status}] [{priority}]{due}")

    await message.answer("\n".join(lines))
