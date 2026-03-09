import asyncio
import logging
import os
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from handlers import start, link, tasks

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "7639602148:AAGk9tDQrWE9VgbRgMTO6f0fRp03csAnNpo")
API_URL = os.getenv("API_URL", "http://localhost:3001")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    logger.info(f"Starting bot with API_URL={API_URL}")

    bot = Bot(token=BOT_TOKEN)
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Include routers
    dp.include_router(link.router)
    dp.include_router(tasks.router)
    dp.include_router(start.router)

    logger.info("Bot started, polling...")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())
