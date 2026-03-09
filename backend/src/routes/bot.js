const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/bot/user/:telegramId
router.get('/user/:telegramId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId },
      select: { id: true, username: true, email: true, uniqueCode: true, telegramId: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /api/bot/link
router.post('/link', async (req, res, next) => {
  try {
    const { uniqueCode, telegramId } = req.body;
    if (!uniqueCode || !telegramId) {
      return res.status(400).json({ error: 'uniqueCode and telegramId are required' });
    }

    const user = await prisma.user.findUnique({
      where: { uniqueCode: uniqueCode.toUpperCase() },
    });
    if (!user) return res.status(404).json({ error: 'User not found with this code' });

    const existingLink = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });
    if (existingLink && existingLink.id !== user.id) {
      return res.status(409).json({ error: 'This Telegram account is already linked' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { telegramId: String(telegramId) },
      select: { id: true, username: true, uniqueCode: true, telegramId: true },
    });

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/bot/tasks/my
router.post('/tasks/my', async (req, res, next) => {
  try {
    const { telegramId, title, description, priority, category, dueDate } = req.body;

    if (!telegramId || !title) {
      return res.status(400).json({ error: 'telegramId and title are required' });
    }

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ error: 'User not found. Link your account first.' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: user.id,
        isTeamTask: false,
      },
      include: {
        owner: { select: { id: true, username: true } },
      },
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/bot/tasks/team
router.post('/tasks/team', async (req, res, next) => {
  try {
    const { telegramId, teamId, title, description, priority, category, dueDate, assigneeId, watcherIds } = req.body;

    if (!telegramId || !title || !teamId) {
      return res.status(400).json({ error: 'telegramId, teamId and title are required' });
    }

    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ error: 'User not found. Link your account first.' });

    const isMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id },
    });
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this team' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: user.id,
        assigneeId: assigneeId || null,
        teamId,
        isTeamTask: true,
        watchers: watcherIds ? { connect: watcherIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        owner: { select: { id: true, username: true } },
        assignee: { select: { id: true, username: true, telegramId: true } },
        team: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /api/bot/teams/:telegramId
router.get('/teams/:telegramId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    const teams = memberships.map((m) => m.team);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

// GET /api/bot/members/:teamId
router.get('/members/:teamId', async (req, res, next) => {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId: req.params.teamId },
      include: {
        user: { select: { id: true, username: true, email: true, telegramId: true } },
      },
    });

    res.json({ members: members.map((m) => ({ ...m.user, role: m.role })) });
  } catch (err) {
    next(err);
  }
});

// GET /api/bot/mytasks/:telegramId
router.get('/mytasks/:telegramId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tasks = await prisma.task.findMany({
      where: {
        ownerId: user.id,
        isTeamTask: false,
        status: { in: ['todo', 'in_progress', 'on_hold', 'stuck'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/bot/categories/:telegramId
router.get('/categories/:telegramId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: user.id }, { isGlobal: true }],
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
