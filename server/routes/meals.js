const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// every route in this file requires a valid token
router.use(authMiddleware);

// GET /api/meals?date=2026-07-08  (date optional, defaults to today)
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const mealsResult = await pool.query(
      `SELECT id, name, calories, meal_type, eaten_on
       FROM meals
       WHERE user_id = $1 AND eaten_on = $2
       ORDER BY created_at ASC`,
      [req.userId, date]
    );

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(calories), 0) AS total
       FROM meals
       WHERE user_id = $1 AND eaten_on = $2`,
      [req.userId, date]
    );

    res.json({
      date,
      meals: mealsResult.rows,
      total: parseInt(totalResult.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meals
router.post('/', async (req, res) => {
  const { name, calories, meal_type, eaten_on } = req.body;

  if (!name || !calories) {
    return res.status(400).json({ error: 'Name and calories are required' });
  }
  if (calories <= 0) {
    return res.status(400).json({ error: 'Calories must be a positive number' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO meals (user_id, name, calories, meal_type, eaten_on)
       VALUES ($1, $2, $3, COALESCE($4, 'other'), COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [req.userId, name, calories, meal_type, eaten_on]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/meals/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;