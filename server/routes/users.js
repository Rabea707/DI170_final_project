const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// PUT /api/users/goal  -> update daily calorie goal
router.put('/goal', async (req, res) => {
  const { daily_goal } = req.body;

  if (!daily_goal || daily_goal <= 0) {
    return res.status(400).json({ error: 'Daily goal must be a positive number' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET daily_goal = $1 WHERE id = $2 RETURNING id, username, email, daily_goal',
      [daily_goal, req.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;