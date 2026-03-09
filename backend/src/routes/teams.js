const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/teams
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: req.user.id },
      include: {
        team: {
          include: {
            owner: { select: { id: true, username: true } },
            members: {
              include: { user: { select: { id: true, username: true, email: true } } },
            },
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

// POST /api/teams
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });

    const team = await prisma.team.create({
      data: {
        name,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'owner' },
        },
      },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });

    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
});

// GET /api/teams/:id
router.get('/:id', async (req, res, next) => {
  try {
    const isMember = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id, userId: req.user.id },
    });
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true, uniqueCode: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ team });
  } catch (err) {
    next(err);
  }
});

// POST /api/teams/:id/invite
router.post('/:id/invite', async (req, res, next) => {
  try {
    const { uniqueCode } = req.body;
    if (!uniqueCode) return res.status(400).json({ error: 'uniqueCode is required' });

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.ownerId !== req.user.id) {
      const myRole = await prisma.teamMember.findFirst({
        where: { teamId: req.params.id, userId: req.user.id },
      });
      if (!myRole || myRole.role !== 'owner') {
        return res.status(403).json({ error: 'Only team owner can invite members' });
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { uniqueCode } });
    if (!targetUser) return res.status(404).json({ error: 'User not found with this code' });

    const existing = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id, userId: targetUser.id },
    });
    if (existing) return res.status(409).json({ error: 'User is already a team member' });

    const member = await prisma.teamMember.create({
      data: { teamId: req.params.id, userId: targetUser.id, role: 'member' },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Owner can remove anyone, members can remove themselves
    if (team.ownerId !== req.user.id && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.params.userId === team.ownerId) {
      return res.status(400).json({ error: 'Cannot remove team owner' });
    }

    await prisma.teamMember.deleteMany({
      where: { teamId: req.params.id, userId: req.params.userId },
    });

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
