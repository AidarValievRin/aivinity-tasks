from aiogram.fsm.state import State, StatesGroup


class LinkStates(StatesGroup):
    waiting_for_code = State()


class TaskStates(StatesGroup):
    choosing_type = State()      # personal or team

    # Personal task
    entering_title = State()
    entering_description = State()
    choosing_category = State()
    choosing_priority = State()
    entering_due_date = State()
    confirming = State()

    # Team task
    choosing_team = State()
    entering_team_title = State()
    entering_team_description = State()
    choosing_team_category = State()
    choosing_team_priority = State()
    choosing_assignee = State()
    choosing_watcher = State()
    entering_team_due_date = State()
    confirming_team = State()
