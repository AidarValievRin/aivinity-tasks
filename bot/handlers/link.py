from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message
from states import LinkStates
from api.client import link_account, get_user_by_telegram
import re

router = Router()


@router.message(Command("link"))
async def cmd_link(message: Message, state: FSMContext):
    user = await get_user_by_telegram(str(message.from_user.id))

    if user:
        await message.answer(
            f"Ваш аккаунт уже привязан к пользователю: {user['username']}\n"
            f"Уникальный код: {user['uniqueCode']}"
        )
        return

    await state.set_state(LinkStates.waiting_for_code)
    await message.answer(
        "Введите ваш уникальный код из веб-панели (формат: AIV-XXXX):\n\n"
        "Код можно найти в разделе Профиль веб-панели AiVinity Tasks."
    )


@router.message(LinkStates.waiting_for_code)
async def process_link_code(message: Message, state: FSMContext):
    code = message.text.strip().upper()

    if not re.match(r'^AIV-[A-Z0-9]{4}$', code):
        await message.answer(
            "Неверный формат кода. Введите код в формате AIV-XXXX (например: AIV-A3X9).\n"
            "Попробуйте ещё раз или отправьте /cancel для отмены."
        )
        return

    try:
        result = await link_account(code, str(message.from_user.id))

        if "error" in result:
            await message.answer(
                f"Ошибка: {result['error']}\n"
                "Проверьте правильность кода и попробуйте снова.\n"
                "Отправьте /cancel для отмены."
            )
            return

        user = result.get("user", {})
        await state.clear()
        await message.answer(
            f"Аккаунт успешно привязан!\n\n"
            f"Добро пожаловать, {user.get('username', '')}!\n"
            f"Теперь вы можете добавлять задачи через бота.\n\n"
            f"Используйте /tasks для создания задач."
        )
    except Exception as e:
        await message.answer(
            "Произошла ошибка при привязке аккаунта. Попробуйте позже.\n"
            "Отправьте /cancel для отмены."
        )


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    current = await state.get_state()
    if current:
        await state.clear()
        await message.answer("Действие отменено.")
    else:
        await message.answer("Нет активного действия для отмены.")
