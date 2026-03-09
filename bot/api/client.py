import os
import aiohttp
from typing import Optional, Any

API_URL = os.getenv("API_URL", "http://localhost:3001")


async def _get(path: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}{path}") as resp:
            return await resp.json()


async def _post(path: str, data: dict) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}{path}", json=data) as resp:
            return await resp.json()


async def get_user_by_telegram(telegram_id: str) -> Optional[dict]:
    try:
        result = await _get(f"/api/bot/user/{telegram_id}")
        return result.get("user")
    except Exception:
        return None


async def link_account(unique_code: str, telegram_id: str) -> dict:
    result = await _post("/api/bot/link", {
        "uniqueCode": unique_code,
        "telegramId": telegram_id,
    })
    return result


async def get_user_teams(telegram_id: str) -> list:
    try:
        result = await _get(f"/api/bot/teams/{telegram_id}")
        return result.get("teams", [])
    except Exception:
        return []


async def get_team_members(team_id: str) -> list:
    try:
        result = await _get(f"/api/bot/members/{team_id}")
        return result.get("members", [])
    except Exception:
        return []


async def get_user_categories(telegram_id: str) -> list:
    try:
        result = await _get(f"/api/bot/categories/{telegram_id}")
        return result.get("categories", [])
    except Exception:
        return []


async def get_my_tasks(telegram_id: str) -> list:
    try:
        result = await _get(f"/api/bot/mytasks/{telegram_id}")
        return result.get("tasks", [])
    except Exception:
        return []


async def create_personal_task(
    telegram_id: str,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    category: Optional[str] = None,
    due_date: Optional[str] = None,
) -> dict:
    data = {
        "telegramId": telegram_id,
        "title": title,
        "priority": priority,
    }
    if description:
        data["description"] = description
    if category:
        data["category"] = category
    if due_date:
        data["dueDate"] = due_date

    return await _post("/api/bot/tasks/my", data)


async def create_team_task(
    telegram_id: str,
    team_id: str,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    category: Optional[str] = None,
    due_date: Optional[str] = None,
    assignee_id: Optional[str] = None,
    watcher_ids: Optional[list] = None,
) -> dict:
    data = {
        "telegramId": telegram_id,
        "teamId": team_id,
        "title": title,
        "priority": priority,
    }
    if description:
        data["description"] = description
    if category:
        data["category"] = category
    if due_date:
        data["dueDate"] = due_date
    if assignee_id:
        data["assigneeId"] = assignee_id
    if watcher_ids:
        data["watcherIds"] = watcher_ids

    return await _post("/api/bot/tasks/team", data)
