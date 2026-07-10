import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeals, addMeal, deleteMeal } from '../api';
import WeeklyChart from '../components/WeeklyChart';
import { updateGoal } from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // meals data
  const [meals, setMeals] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  // add meal form
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [mealType, setMealType] = useState('other');

  // load today's meals when the page opens
  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const data = await getMeals();
      setMeals(data.meals);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddMeal(e) {
    e.preventDefault();
    setError('');

    try {
      await addMeal({ name, calories: parseInt(calories), meal_type: mealType });
      setName('');
      setCalories('');
      setMealType('other');
      loadMeals(); // refresh list + total
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMeal(id);
      loadMeals();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGoalSubmit(e) {
    e.preventDefault();
    try {
      const updated = await updateGoal(parseInt(newGoal));
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...storedUser, daily_goal: updated.daily_goal };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditingGoal(false);
      window.location.reload(); // simplest way to refresh goal everywhere
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const goal = user?.daily_goal || 2000;
  const remaining = goal - total;

  return (
    <div className="dashboard">
      <header>
        <h1>Calorie Tracker</h1>
        <div>
          <span>Hi, {user?.username}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="summary">
        <div className="stat">
          <h3>Today</h3>
          <p className="big">{total} kcal</p>
        </div>
        <div className="stat">
          <h3>Goal</h3>
          {editingGoal ? (
            <form onSubmit={handleGoalSubmit} className="goal-form">
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                min="1"
                placeholder={goal}
                required
              />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingGoal(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <p className="big" onClick={() => setEditingGoal(true)}>
              {goal} kcal ✏️
            </p>
          )}
        </div>
        <div className="stat">
          <h3>{remaining >= 0 ? 'Remaining' : 'Over goal'}</h3>
          <p className="big">{Math.abs(remaining)} kcal</p>
        </div>
      </section>

      <section className="goal-progress">
        <div className="row">
          <span>
            <b>{total}</b> / {goal} kcal
          </span>
          <span>{Math.min(Math.round((total / goal) * 100), 999)}%</span>
        </div>
        <div className="track">
          <div
            className={`fill ${total > goal ? 'over' : ''}`}
            style={{ width: `${Math.min((total / goal) * 100, 100)}%` }}
          />
        </div>
      </section>

      <section className="add-meal">
        <h2>Add a meal</h2>
        <form onSubmit={handleAddMeal}>
          <input
            type="text"
            placeholder="Meal name (e.g. Shawarma)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min="1"
            required
          />
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="other">Other</option>
          </select>
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="meals-list">
        <h2>Today's meals</h2>
        {meals.length === 0 ? (
          <p className="empty-state">No meals logged yet today. Add your first one above 👆</p>
        ) : (
          <ul>
            {meals.map((meal) => (
              <li key={meal.id}>
                <span>{meal.name}</span>
                <span className="meal-type">{meal.meal_type}</span>
                <span>{meal.calories} kcal</span>
                <button onClick={() => handleDelete(meal.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="chart">
        <WeeklyChart goal={goal} refreshKey={total} />
      </section>
    </div>
  );
}

export default Dashboard;