const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// helper: get the saved token
function getToken() {
  return localStorage.getItem('token');
}

// generic request function
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// auth
export function register(username, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// meals
export function getMeals(date) {
  return request(date ? `/meals?date=${date}` : '/meals');
}

export function addMeal(meal) {
  return request('/meals', {
    method: 'POST',
    body: JSON.stringify(meal),
  });
}

export function deleteMeal(id) {
  return request(`/meals/${id}`, { method: 'DELETE' });
}

export function getSummary(days = 7) {
  return request(`/meals/summary?days=${days}`);
}

// user
export function updateGoal(daily_goal) {
  return request('/users/goal', {
    method: 'PUT',
    body: JSON.stringify({ daily_goal }),
  });
}