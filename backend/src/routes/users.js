const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users/search?code=AIV-XXXX
router.get('/search', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code query param is required' });

    const user = await prisma.user.findUnique({
      where: { uniqueCode: code.toUpperCase() },
      select: { id: true, username: true, email: true, uniqueCode: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/telegram
router.put('/telegram', async (req, res, next) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

    const existing = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ error: 'This Telegram account is already linked to another user' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { telegramId: String(telegramId) },
      select: { id: true, username: true, email: true, uniqueCode: true, telegramId: true },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
