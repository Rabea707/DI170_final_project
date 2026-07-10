import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getSummary } from '../api';

// register the chart pieces we use
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function WeeklyChart({ goal, refreshKey }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    getSummary(7)
      .then((data) => setSummary(data.data))
      .catch(console.error);
  }, [refreshKey]);

  // build the last 7 days, filling missing days with 0
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const labels = days.map((d) =>
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
  );

  const totals = days.map((d) => {
    const dayString = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const found = summary.find(
      (row) => new Date(row.date).toLocaleDateString('en-CA') === dayString
    );
    return found ? found.total : 0;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Calories eaten',
        data: totals,
        borderColor: '#4f8ef7',
        backgroundColor: '#4f8ef7',
        tension: 0.3,
      },
      {
        label: 'Daily goal',
        data: days.map(() => goal),
        borderColor: '#e74c3c',
        borderDash: [6, 6],
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Last 7 days vs goal' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Line data={data} options={options} />;
}

export default WeeklyChart;