const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const taskInclude = {
  owner: { select: { id: true, username: true, email: true } },
  assignee: { select: { id: true, username: true, email: true } },
  watchers: { select: { id: true, username: true, email: true } },
  comments: {
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  },
};

// GET /api/tasks/my
router.get('/', async (req, res, next) => {
  try {
    const { search, priority, status, category } = req.query;

    const where = {
      ownerId: req.user.id,
      isTeamTask: false,
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

// POST /api/tasks/my
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, category, dueDate, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
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
        isTeamTask: false,
      },
      include: taskInclude,
    });

    req.io.emit('task:created', task);

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/my/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user.id, isTeamTask: false },
      include: taskInclude,
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/my/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, status, priority, category, dueDate, assigneeId, order } = req.body;

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user.id, isTeamTask: false },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

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
      },
      include: taskInclude,
    });

    req.io.emit('task:updated', task);

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/my/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user.id, isTeamTask: false },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.comment.deleteMany({ where: { taskId: req.params.id } });
    await prisma.task.update({
      where: { id: req.params.id },
      data: { watchers: { set: [] } },
    });
    await prisma.task.delete({ where: { id: req.params.id } });

    req.io.emit('task:deleted', { id: req.params.id });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/my/:id/status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'on_hold', 'stuck', 'cancelled', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user.id, isTeamTask: false },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: taskInclude,
    });

    req.io.emit('task:updated', task);

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/my/:id/comments
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user.id, isTeamTask: false },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: req.params.id,
        userId: req.user.id,
      },
      include: { user: { select: { id: true, username: true } } },
    });

    req.io.emit('comment:added', { taskId: req.params.id, comment });

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
