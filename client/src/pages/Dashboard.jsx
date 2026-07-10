function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <p>Dashboard coming soon...</p>
    </div>
  );
}

export default Dashboard;