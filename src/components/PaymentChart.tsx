import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler, 
  ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useMemo } from 'react';

interface Payment {
  paidDate: string;
  amount: number;
  block: 'OLD' | 'NEW' | 'NYERI';
}

interface PaymentChartProps {
  payments: Payment[];
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
   Filler 
);

export function PaymentChart({ payments }: PaymentChartProps) {
  const { lineData, barData, doughnutData, options } = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    const blockTotals: Record<'OLD' | 'NEW' | 'NYERI', number> = { OLD: 0, NEW: 0, NYERI: 0 };

    payments.forEach((p) => {
      if (!p.paidDate) return;
      const month = new Date(p.paidDate).toLocaleString('default', { month: 'short' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + p.amount;
      blockTotals[p.block] += p.amount;
    });

    const labels = Object.keys(monthlyTotals);
    const values = Object.values(monthlyTotals);

    const commonOptions: ChartOptions<'line' | 'bar'> = {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#374151',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `KSh ${context.parsed.y?.toLocaleString() || ''}`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#374151',
            callback: function (tickValue) {
              const num = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
              return `KSh ${num.toLocaleString()}`;
            }
          },
          grid: { color: '#e5e7eb' }
        },
        x: {
          ticks: { color: '#6b7280' },
          grid: { display: false }
        }
      }
    };

    const lineData = {
      labels,
      datasets: [
        {
          label: 'Revenue Trend',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };

    const barData = {
      labels,
      datasets: [
        {
          label: 'Monthly Revenue',
          data: values,
          backgroundColor: 'rgba(16,185,129,0.6)',
          borderRadius: 6
        }
      ]
    };

    const doughnutData = {
      labels: ['OLD Block', 'NEW Block', 'NYERI Block'],
      datasets: [
        {
          label: 'Block Revenue',
          data: [blockTotals.OLD, blockTotals.NEW, blockTotals.NYERI],
          backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
          borderColor: ['#fbbf24', '#34d399', '#60a5fa'],
          borderWidth: 2
        }
      ]
    };

    return { lineData, barData, doughnutData, options: commonOptions };
  }, [payments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Line Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <Line data={lineData} options={options} />
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
        <Bar data={barData} options={options} />
      </div>

      {/* Doughnut Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4">Block-wise Revenue</h3>
        <Doughnut
          data={doughnutData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#374151',
                  font: { size: 12, weight: 'bold' }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => `KSh ${context.parsed.toLocaleString()}`
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
