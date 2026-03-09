const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const taskInclude = {
  owner: { select: { id: true, username: true, email: true } },
  assignee: { select: { id: true, username: true, email: true } },
  watchers: { select: { id: true, username: true, email: true } },
  team: { select: { id: true, name: true } },
  comments: {
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  },
};

async function getUserTeamIds(userId) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

async function canAccessTeamTask(userId, taskId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, isTeamTask: true },
    select: { id: true, teamId: true, ownerId: true },
  });
  if (!task) return null;

  const isMember = await prisma.teamMember.findFirst({
    where: { teamId: task.teamId, userId },
  });
  if (!isMember && task.ownerId !== userId) return null;
  return task;
}

// GET /api/tasks/team
router.get('/', async (req, res, next) => {
  try {
    const { search, priority, status, category, teamId } = req.query;
    const teamIds = await getUserTeamIds(req.user.id);

    if (teamIds.length === 0) {
      return res.json({ tasks: [] });
    }

    const where = {
      isTeamTask: true,
      teamId: teamId ? teamId : { in: teamIds },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (category) where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/team
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, category, dueDate, assigneeId, teamId, watcherIds } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!teamId) return res.status(400).json({ error: 'teamId is required' });

    const isMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: req.user.id },
    });
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: req.user.id,
        assigneeId: assigneeId || null,
        teamId,
        isTeamTask: true,
        watchers: watcherIds ? { connect: watcherIds.map((id) => ({ id })) } : undefined,
      },
      include: taskInclude,
    });

    req.io.to(`team:${teamId}`).emit('task:created', task);

    // Notify assignee
    if (assigneeId && assigneeId !== req.user.id) {
      req.io.to(`user:${assigneeId}`).emit('task:assigned', {
        task,
        message: `Вам назначена новая задача: ${task.title}`,
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/team/:id
router.get('/:id', async (req, res, next) => {
  try {
    const accessible = await canAccessTeamTask(req.user.id, req.params.id);
    if (!accessible) return res.status(404).json({ error: 'Task not found' });

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskInclude,
    });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/team/:id
router.put('/:id', async (req, res, next) => {
  try {
    const accessible = await canAccessTeamTask(req.user.id, req.params.id);
    if (!accessible) return res.status(404).json({ error: 'Task not found' });

    const { title, description, status, priority, category, dueDate, assigneeId, order, watcherIds } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(order !== undefined && { order }),
        ...(watcherIds !== undefined && { watchers: { set: watcherIds.map((id) => ({ id })) } }),
      },
      include: taskInclude,
    });

    req.io.to(`team:${task.teamId}`).emit('task:updated', task);

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/team/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, isTeamTask: true },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isMember = await prisma.teamMember.findFirst({
      where: { teamId: task.teamId, userId: req.user.id },
    });
    if (!isMember && task.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.deleteMany({ where: { taskId: req.params.id } });
    await prisma.task.update({
      where: { id: req.params.id },
      data: { watchers: { set: [] } },
    });
    await prisma.task.delete({ where: { id: req.params.id } });

    req.io.to(`team:${task.teamId}`).emit('task:deleted', { id: req.params.id });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/team/:id/status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'on_hold', 'stuck', 'cancelled', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const accessible = await canAccessTeamTask(req.user.id, req.params.id);
    if (!accessible) return res.status(404).json({ error: 'Task not found' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: taskInclude,
    });

    req.io.to(`team:${task.teamId}`).emit('task:updated', task);

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/team/:id/comments
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const accessible = await canAccessTeamTask(req.user.id, req.params.id);
    if (!accessible) return res.status(404).json({ error: 'Task not found' });

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: req.params.id,
        userId: req.user.id,
      },
      include: { user: { select: { id: true, username: true } } },
    });

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: { teamId: true },
    });

    req.io.to(`team:${task.teamId}`).emit('comment:added', { taskId: req.params.id, comment });

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
