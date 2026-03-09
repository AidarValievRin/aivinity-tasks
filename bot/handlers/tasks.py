from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from states import TaskStates
from api.client import (
    get_user_by_telegram,
    get_user_teams,
    get_team_members,
    get_user_categories,
    create_personal_task,
    create_team_task,
)
from datetime import datetime

router = Router()

PRIORITY_MAP = {
    "low": "Низкий",
    "medium": "Средний",
    "high": "Высокий",
    "urgent": "Срочно",
}


def make_inline_kb(buttons: list[tuple[str, str]], row_width: int = 2) -> InlineKeyboardMarkup:
    rows = []
    current_row = []
    for text, callback in buttons:
        current_row.append(InlineKeyboardButton(text=text, callback_data=callback))
        if len(current_row) == row_width:
            rows.append(current_row)
            current_row = []
    if current_row:
        rows.append(current_row)
    return InlineKeyboardMarkup(inline_keyboard=rows)


@router.message(Command("tasks"))
async def cmd_tasks(message: Message, state: FSMContext):
    user = await get_user_by_telegram(str(message.from_user.id))
    if not user:
        await message.answer(
            "Аккаунт не привязан. Используйте /link для привязки."
        )
        return

    kb = make_inline_kb([
        ("Мои задачи", "task_type:personal"),
        ("Командные задачи", "task_type:team"),
    ], row_width=2)

    await state.set_state(TaskStates.choosing_type)
    await message.answer("Куда добавить задачу?", reply_markup=kb)


@router.callback_query(TaskStates.choosing_type, F.data.startswith("task_type:"))
async def choose_task_type(callback: CallbackQuery, state: FSMContext):
    task_type = callback.data.split(":")[1]
    await callback.answer()

    if task_type == "personal":
        await state.set_state(TaskStates.entering_title)
        await callback.message.edit_text("Введите заголовок задачи:")
    else:
        # Load teams
        teams = await get_user_teams(str(callback.from_user.id))
        if not teams:
            await callback.message.edit_text(
                "У вас нет команд. Сначала создайте команду в веб-панели."
            )
            await state.clear()
            return

        await state.update_data(teams=teams)
        buttons = [(team["name"], f"team:{team['id']}") for team in teams]
        kb = make_inline_kb(buttons, row_width=1)
        await state.set_state(TaskStates.choosing_team)
        await callback.message.edit_text("Выберите команду:", reply_markup=kb)


# =====================
# PERSONAL TASK FLOW
# =====================

@router.message(TaskStates.entering_title)
async def enter_title(message: Message, state: FSMContext):
    title = message.text.strip()
    if not title:
        await message.answer("Заголовок не может быть пустым. Введите заголовок:")
        return

    await state.update_data(title=title, task_type="personal")
    await state.set_state(TaskStates.entering_description)
    await message.answer("Введите описание задачи (или отправьте /skip для пропуска):")


@router.message(TaskStates.entering_description)
async def enter_description(message: Message, state: FSMContext):
    if message.text == "/skip":
        await state.update_data(description=None)
    else:
        await state.update_data(description=message.text.strip())

    # Load categories
    categories = await get_user_categories(str(message.from_user.id))
    await state.update_data(categories=categories)

    buttons = [(cat["name"], f"category:{cat['name']}") for cat in categories[:10]]
    buttons.append(("Без категории", "category:none"))
    kb = make_inline_kb(buttons, row_width=2)

    await state.set_state(TaskStates.choosing_category)
    await message.answer("Выберите категорию задачи:", reply_markup=kb)


@router.callback_query(TaskStates.choosing_category, F.data.startswith("category:"))
async def choose_category(callback: CallbackQuery, state: FSMContext):
    cat = callback.data.split(":", 1)[1]
    await callback.answer()

    if cat == "none":
        await state.update_data(category=None)
    else:
        await state.update_data(category=cat)

    buttons = [(label, f"priority:{key}") for key, label in PRIORITY_MAP.items()]
    kb = make_inline_kb(buttons, row_width=2)

    await state.set_state(TaskStates.choosing_priority)
    await callback.message.edit_text("Укажите приоритет задачи:", reply_markup=kb)


@router.callback_query(TaskStates.choosing_priority, F.data.startswith("priority:"))
async def choose_priority(callback: CallbackQuery, state: FSMContext):
    priority = callback.data.split(":")[1]
    await callback.answer()
    await state.update_data(priority=priority)

    await state.set_state(TaskStates.entering_due_date)
    await callback.message.edit_text(
        "Укажите срок выполнения в формате ДД.ММ.ГГГГ\n"
        "или отправьте /skip для пропуска:"
    )


@router.message(TaskStates.entering_due_date)
async def enter_due_date(message: Message, state: FSMContext):
    if message.text == "/skip":
        await state.update_data(due_date=None)
    else:
        try:
            dt = datetime.strptime(message.text.strip(), "%d.%m.%Y")
            await state.update_data(due_date=dt.strftime("%Y-%m-%dT00:00:00.000Z"))
        except ValueError:
            await message.answer(
                "Неверный формат даты. Используйте ДД.ММ.ГГГГ (например: 31.12.2024)\n"
                "или /skip для пропуска:"
            )
            return

    data = await state.get_data()
    due_str = data.get("due_date", "")[:10] if data.get("due_date") else "Не указан"
    cat_str = data.get("category") or "Без категории"
    priority_str = PRIORITY_MAP.get(data.get("priority", "medium"), "Средний")

    confirm_text = (
        "Подтвердите создание задачи:\n\n"
        f"Заголовок: {data['title']}\n"
        f"Описание: {data.get('description') or 'Нет'}\n"
        f"Категория: {cat_str}\n"
        f"Приоритет: {priority_str}\n"
        f"Срок: {due_str}"
    )

    kb = make_inline_kb([
        ("Создать", "confirm:yes"),
        ("Отмена", "confirm:no"),
    ], row_width=2)

    await state.set_state(TaskStates.confirming)
    await message.answer(confirm_text, reply_markup=kb)


@router.callback_query(TaskStates.confirming, F.data.startswith("confirm:"))
async def confirm_personal_task(callback: CallbackQuery, state: FSMContext):
    action = callback.data.split(":")[1]
    await callback.answer()

    if action == "no":
        await state.clear()
        await callback.message.edit_text("Создание задачи отменено.")
        return

    data = await state.get_data()
    await state.clear()

    try:
        result = await create_personal_task(
            telegram_id=str(callback.from_user.id),
            title=data["title"],
            description=data.get("description"),
            priority=data.get("priority", "medium"),
            category=data.get("category"),
            due_date=data.get("due_date"),
        )

        if "error" in result:
            await callback.message.edit_text(f"Ошибка: {result['error']}")
            return

        task = result.get("task", {})
        await callback.message.edit_text(
            f"Задача успешно создана!\n\n"
            f"Название: {task.get('title', data['title'])}\n"
            f"Статус: Новая\n\n"
            f"Задача добавлена в вашу веб-панель."
        )
    except Exception as e:
        await callback.message.edit_text(
            "Произошла ошибка при создании задачи. Попробуйте позже."
        )


# =====================
# TEAM TASK FLOW
# =====================

@router.callback_query(TaskStates.choosing_team, F.data.startswith("team:"))
async def choose_team(callback: CallbackQuery, state: FSMContext):
    team_id = callback.data.split(":")[1]
    await callback.answer()

    data = await state.get_data()
    teams = data.get("teams", [])
    team = next((t for t in teams if t["id"] == team_id), None)

    await state.update_data(team_id=team_id, team_name=team["name"] if team else "")
    await state.set_state(TaskStates.entering_team_title)
    await callback.message.edit_text(
        f"Команда: {team['name'] if team else team_id}\n\nВведите заголовок задачи:"
    )


@router.message(TaskStates.entering_team_title)
async def enter_team_title(message: Message, state: FSMContext):
    title = message.text.strip()
    if not title:
        await message.answer("Заголовок не может быть пустым. Введите заголовок:")
        return

    await state.update_data(title=title, task_type="team")
    await state.set_state(TaskStates.entering_team_description)
    await message.answer("Введите описание задачи (или /skip для пропуска):")


@router.message(TaskStates.entering_team_description)
async def enter_team_description(message: Message, state: FSMContext):
    if message.text == "/skip":
        await state.update_data(description=None)
    else:
        await state.update_data(description=message.text.strip())

    categories = await get_user_categories(str(message.from_user.id))
    await state.update_data(categories=categories)

    buttons = [(cat["name"], f"tcat:{cat['name']}") for cat in categories[:10]]
    buttons.append(("Без категории", "tcat:none"))
    kb = make_inline_kb(buttons, row_width=2)

    await state.set_state(TaskStates.choosing_team_category)
    await message.answer("Выберите категорию:", reply_markup=kb)


@router.callback_query(TaskStates.choosing_team_category, F.data.startswith("tcat:"))
async def choose_team_category(callback: CallbackQuery, state: FSMContext):
    cat = callback.data.split(":", 1)[1]
    await callback.answer()

    await state.update_data(category=None if cat == "none" else cat)

    buttons = [(label, f"tpriority:{key}") for key, label in PRIORITY_MAP.items()]
    kb = make_inline_kb(buttons, row_width=2)

    await state.set_state(TaskStates.choosing_team_priority)
    await callback.message.edit_text("Укажите приоритет:", reply_markup=kb)


@router.callback_query(TaskStates.choosing_team_priority, F.data.startswith("tpriority:"))
async def choose_team_priority(callback: CallbackQuery, state: FSMContext):
    priority = callback.data.split(":")[1]
    await callback.answer()
    await state.update_data(priority=priority)

    data = await state.get_data()
    members = await get_team_members(data["team_id"])
    await state.update_data(members=members)

    buttons = [(m["username"], f"assignee:{m['id']}") for m in members]
    buttons.append(("Не назначать", "assignee:none"))
    kb = make_inline_kb(buttons, row_width=1)

    await state.set_state(TaskStates.choosing_assignee)
    await callback.message.edit_text("Назначьте ответственного:", reply_markup=kb)


@router.callback_query(TaskStates.choosing_assignee, F.data.startswith("assignee:"))
async def choose_assignee(callback: CallbackQuery, state: FSMContext):
    assignee_id = callback.data.split(":")[1]
    await callback.answer()

    if assignee_id == "none":
        await state.update_data(assignee_id=None)
    else:
        await state.update_data(assignee_id=assignee_id)

    data = await state.get_data()
    members = data.get("members", [])
    buttons = [(m["username"], f"watcher:{m['id']}") for m in members]
    buttons.append(("Пропустить", "watcher:skip"))
    kb = make_inline_kb(buttons, row_width=1)

    await state.set_state(TaskStates.choosing_watcher)
    await callback.message.edit_text("Добавьте наблюдателя (или пропустите):", reply_markup=kb)


@router.callback_query(TaskStates.choosing_watcher, F.data.startswith("watcher:"))
async def choose_watcher(callback: CallbackQuery, state: FSMContext):
    watcher_id = callback.data.split(":")[1]
    await callback.answer()

    if watcher_id == "skip":
        await state.update_data(watcher_ids=None)
    else:
        await state.update_data(watcher_ids=[watcher_id])

    await state.set_state(TaskStates.entering_team_due_date)
    await callback.message.edit_text(
        "Укажите срок выполнения в формате ДД.ММ.ГГГГ\n"
        "или /skip для пропуска:"
    )


@router.message(TaskStates.entering_team_due_date)
async def enter_team_due_date(message: Message, state: FSMContext):
    if message.text == "/skip":
        await state.update_data(due_date=None)
    else:
        try:
            dt = datetime.strptime(message.text.strip(), "%d.%m.%Y")
            await state.update_data(due_date=dt.strftime("%Y-%m-%dT00:00:00.000Z"))
        except ValueError:
            await message.answer(
                "Неверный формат. Используйте ДД.ММ.ГГГГ или /skip:"
            )
            return

    data = await state.get_data()
    due_str = data.get("due_date", "")[:10] if data.get("due_date") else "Не указан"
    priority_str = PRIORITY_MAP.get(data.get("priority", "medium"), "Средний")

    members = data.get("members", [])
    assignee_name = "Не назначен"
    if data.get("assignee_id"):
        member = next((m for m in members if m["id"] == data["assignee_id"]), None)
        if member:
            assignee_name = member["username"]

    confirm_text = (
        f"Подтвердите создание задачи в команде {data.get('team_name')}:\n\n"
        f"Заголовок: {data['title']}\n"
        f"Описание: {data.get('description') or 'Нет'}\n"
        f"Категория: {data.get('category') or 'Без категории'}\n"
        f"Приоритет: {priority_str}\n"
        f"Ответственный: {assignee_name}\n"
        f"Срок: {due_str}"
    )

    kb = make_inline_kb([
        ("Создать", "tconfirm:yes"),
        ("Отмена", "tconfirm:no"),
    ], row_width=2)

    await state.set_state(TaskStates.confirming_team)
    await message.answer(confirm_text, reply_markup=kb)


@router.callback_query(TaskStates.confirming_team, F.data.startswith("tconfirm:"))
async def confirm_team_task(callback: CallbackQuery, state: FSMContext):
    action = callback.data.split(":")[1]
    await callback.answer()

    if action == "no":
        await state.clear()
        await callback.message.edit_text("Создание задачи отменено.")
        return

    data = await state.get_data()
    await state.clear()

    try:
        result = await create_team_task(
            telegram_id=str(callback.from_user.id),
            team_id=data["team_id"],
            title=data["title"],
            description=data.get("description"),
            priority=data.get("priority", "medium"),
            category=data.get("category"),
            due_date=data.get("due_date"),
            assignee_id=data.get("assignee_id"),
            watcher_ids=data.get("watcher_ids"),
        )

        if "error" in result:
            await callback.message.edit_text(f"Ошибка: {result['error']}")
            return

        task = result.get("task", {})
        assignee = task.get("assignee", {})
        msg = f"Задача успешно создана в команде {data.get('team_name')}!\n\nНазвание: {task.get('title', data['title'])}"

        if assignee:
            msg += f"\nОтветственный: {assignee.get('username', '')}"

        msg += "\n\nЗадача добавлена в вашу веб-панель."
        await callback.message.edit_text(msg)
    except Exception as e:
        await callback.message.edit_text(
            "Произошла ошибка при создании задачи. Попробуйте позже."
        )
