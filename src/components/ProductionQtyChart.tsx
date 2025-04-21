import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface ProductionQtyChartProps {
  monthlyTotals: { month: string; total: number }[];
  showAll: boolean;
  height?: number;
  label?: string;
  color?: string;
  prefix?: string;
}

const ProductionQtyChart: React.FC<ProductionQtyChartProps> = ({ monthlyTotals, showAll, height = 220, label = 'Total Qty', color = '#2563eb', prefix = '' }) => {
  const data = {
    labels: monthlyTotals.map(item => item.month),
    datasets: [
      {
        label,
        data: monthlyTotals.map(item => item.total),
        backgroundColor: color,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: label,
        color: '#222',
        font: { size: 18, weight: 700 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${label}: ${prefix}${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#222' }, grid: { color: '#eee' } },
      y: { beginAtZero: true, ticks: { color: '#222' }, grid: { color: '#eee' } },
    },
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 24, marginBottom: 32 }}>
      <Bar data={data} options={options} height={height} />
    </div>
  );
};

export default ProductionQtyChart;
