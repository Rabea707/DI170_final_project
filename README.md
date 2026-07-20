# Calorie Tracker

A full-stack web app for tracking daily meals and calories. Users register, log what they eat, set a daily calorie goal, and see their progress on a weekly chart.

**Live demo:** [di-170-final-project.vercel.app](https://di-170-final-project.vercel.app)

Built as my final project for the Full-Stack Development bootcamp at Octopus Developers Institute.

## Features

- User registration and login with JWT authentication
- Log meals with name, calories, meal type (breakfast / lunch / dinner / snack / other), and date
- Daily view with running calorie total
- Personal daily calorie goal (editable)
- Weekly summary chart (Chart.js) showing calories per day
- Per-user data isolation — every query is scoped to the logged-in user, so users can only see and delete their own meals

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, Vite, React Router, Chart.js |
| Backend  | Node.js, Express                    |
| Database | PostgreSQL (hosted on Neon)         |
| Auth     | JWT (jsonwebtoken) + bcrypt         |
| Hosting  | Vercel (client) + Render (server)   |

## Project Structure

```
├── client/               # React + Vite frontend
│   └── src/
│       ├── api.js        # fetch helper that injects the JWT token
│       ├── pages/        # Login, Register, Dashboard
│       └── components/   # WeeklyChart, ProtectedRoute, etc.
└── server/               # Express backend
    ├── server.js         # app entry point
    ├── db.js             # PostgreSQL connection pool
    ├── middleware/
    │   └── auth.js       # verifies JWT, attaches req.userId
    └── routes/
        ├── auth.js       # register / login
        ├── meals.js      # meal CRUD + weekly summary
        └── users.js      # daily goal
```

## Database Schema

Two tables. The full SQL is in [`server/schema.sql`](server/schema.sql).

**users**

| Column        | Type         | Notes                       |
| ------------- | ------------ | --------------------------- |
| id            | SERIAL PK    |                             |
| username      | VARCHAR      | unique                      |
| email         | VARCHAR      | unique                      |
| password_hash | VARCHAR      | bcrypt hash, never plaintext |
| daily_goal    | INTEGER      | default 2000                |
| created_at    | TIMESTAMPTZ  | default NOW()               |

**meals**

| Column     | Type        | Notes                              |
| ---------- | ----------- | ---------------------------------- |
| id         | SERIAL PK   |                                    |
| user_id    | INTEGER FK  | references users(id), ON DELETE CASCADE |
| name       | VARCHAR     |                                    |
| calories   | INTEGER     | must be positive                   |
| meal_type  | VARCHAR     | defaults to 'other'                |
| eaten_on   | DATE        | defaults to today                  |
| created_at | TIMESTAMPTZ | default NOW()                      |

## API Endpoints

All `/api/meals` and `/api/users` routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint                  | Description                                    |
| ------ | ------------------------- | ---------------------------------------------- |
| POST   | `/api/auth/register`      | Create account, returns token + user           |
| POST   | `/api/auth/login`         | Log in, returns token + user                   |
| GET    | `/api/meals?date=`        | Meals + total for a date (defaults to today)   |
| GET    | `/api/meals/summary?days=`| Daily calorie totals for the chart (default 7) |
| POST   | `/api/meals`              | Add a meal                                     |
| DELETE | `/api/meals/:id`          | Delete a meal (only your own)                  |
| PUT    | `/api/users/goal`         | Update daily calorie goal                      |
| GET    | `/api/health`             | Health check (DB connectivity)                 |

## Running Locally

**Prerequisites:** Node.js 18+, a PostgreSQL database (local or [Neon](https://neon.tech)).

**1. Clone and install**

```bash
git clone https://github.com/Rabea707/DI170_final_project.git
cd DI170_final_project
cd server && npm install
cd ../client && npm install
```

**2. Create the database tables**

Run the SQL in `server/schema.sql` against your database (e.g. in the Neon SQL editor or with `psql`).

**3. Environment variables**

Create `server/.env`:

```
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your-long-random-secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

**4. Run it**

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open http://localhost:5173.

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds); plaintext is never stored.
- All SQL queries are parameterized — no string concatenation, no SQL injection.
- Every meal query is scoped to the authenticated user (`WHERE user_id = $1`), and deletes check ownership (`WHERE id = $1 AND user_id = $2`), preventing access to other users' data.
- Login returns a generic "Invalid credentials" message to avoid user enumeration.
- Secrets (DB URL, JWT secret) live in environment variables and are excluded via `.gitignore`.

**Known trade-off:** the access token is stored in `localStorage` with a 7-day expiry, which is acceptable for this project's scope but would be vulnerable to XSS in production. The next step for a production app would be short-lived access tokens with an httpOnly-cookie refresh token.

## Author

**Rabea Sayegh**
Portfolio: [sayeghtech.com](https://sayeghtech.com) · GitHub: [Rabea707](https://github.com/Rabea707) · LinkedIn: [rabea-sayegh](https://www.linkedin.com/in/rabea-sayegh-7b0ab4369)