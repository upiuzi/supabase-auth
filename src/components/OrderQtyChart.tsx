import React from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface OrderQtyChartProps {
  monthlyQty: { month: string; qty: number }[];
}

const OrderQtyChart: React.FC<OrderQtyChartProps> = ({ monthlyQty }) => {
  const data = {
    labels: monthlyQty.map((item) => item.month),
    datasets: [
      {
        label: 'Qty Order',
        data: monthlyQty.map((item) => item.qty),
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Order per Bulan (Qty)',
        color: '#222',
        font: { size: 18, weight: 700 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Qty: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#222' },
        grid: { color: '#eee' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#222' },
        grid: { color: '#eee' },
      },
    },
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 24, marginBottom: 32 }}>
      <Bar data={data} options={options} height={280} />
    </div>
  );
};

export default OrderQtyChart;
