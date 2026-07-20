// API tests for the Calorie Tracker server.
// The database is mocked (jest.mock('../db')), so these run anywhere
// without a real PostgreSQL connection.

process.env.JWT_SECRET = 'test-secret';

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../db');
const app = require('../app');

// helper: make a valid token for a given user id
function tokenFor(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/auth/register', () => {
  test('rejects missing fields with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'rabea' }); // no email, no password

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rejects short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'rabea', email: 'r@test.com', password: '123' });

    expect(res.status).toBe(400);
  });

  test('creates a user and returns a token', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'rabea', email: 'r@test.com', daily_goal: 2000 }],
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'rabea', email: 'r@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('rabea');
  });

  test('returns 409 when username/email already exists', async () => {
    pool.query.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'rabea', email: 'r@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('wrong password returns generic 401 (no user enumeration)', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'rabea', email: 'r@test.com', password_hash: hash, daily_goal: 2000 }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'r@test.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('unknown email returns the same generic 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});

describe('auth middleware', () => {
  test('requests without a token are rejected with 401', async () => {
    const res = await request(app).get('/api/meals');
    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('requests with an invalid token are rejected with 401', async () => {
    const res = await request(app)
      .get('/api/meals')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/meals', () => {
  test('rejects non-positive calories with 400', async () => {
    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenFor(1)}`)
      .send({ name: 'Air', calories: -100 });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('creates a meal for the authenticated user', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 10, user_id: 1, name: 'Shawarma', calories: 650, meal_type: 'lunch' }],
    });

    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenFor(1)}`)
      .send({ name: 'Shawarma', calories: 650, meal_type: 'lunch' });

    expect(res.status).toBe(201);
    // the user_id passed to the query must come from the token, not the request body
    expect(pool.query.mock.calls[0][1][0]).toBe(1);
  });
});

describe('DELETE /api/meals/:id (ownership)', () => {
  test("user B cannot delete user A's meal (gets 404)", async () => {
    // DB returns no rows because WHERE id = $1 AND user_id = $2 doesn't match
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/meals/10') // meal belongs to user 1
      .set('Authorization', `Bearer ${tokenFor(2)}`); // but user 2 is asking

    expect(res.status).toBe(404);
    // verify the query was scoped to the requesting user's id
    const params = pool.query.mock.calls[0][1];
    expect(params).toEqual(['10', 2]);
  });

  test('owner can delete their own meal', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    const res = await request(app)
      .delete('/api/meals/10')
      .set('Authorization', `Bearer ${tokenFor(1)}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(10);
  });
});

describe('PUT /api/users/goal', () => {
  test('rejects non-positive goal with 400', async () => {
    const res = await request(app)
      .put('/api/users/goal')
      .set('Authorization', `Bearer ${tokenFor(1)}`)
      .send({ daily_goal: 0 });

    expect(res.status).toBe(400);
  });
});