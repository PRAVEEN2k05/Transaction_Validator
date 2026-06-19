import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface ChartData {
  payment_mode_distribution: Array<{ name: string; value: number }>;
  transactions_by_country: Array<{ country: string; count: number }>;
  daily_orders: Array<{ date: string; count: number }>;
  error_distribution: Array<{ name: string; value: number }>;
}

interface AnalyticsChartsProps {
  data: ChartData | null;
  theme: 'light' | 'dark';
}

const COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4'  // Cyan
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, theme }) => {
  if (!data) {
    return (
      <div className="flex justify-center items-center h-64 text-zinc-500">
        No analytics data available. Upload and validate a dataset first.
      </div>
    );
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const tooltipBg = isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
      
      {/* 1. Payment Mode Distribution (Pie Chart) */}
      <div className="glass-card p-6 rounded-2xl flex flex-col h-96">
        <h3 className="text-md font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          Payment Mode Distribution
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.payment_mode_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
              >
                {data.payment_mode_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  color: isDark ? '#fff' : '#000',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Transactions by Country (Bar Chart) */}
      <div className="glass-card p-6 rounded-2xl flex flex-col h-96">
        <h3 className="text-md font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          Transactions by Country
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.transactions_by_country}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="country" stroke={textColor} fontSize={12} tickLine={false} />
              <YAxis stroke={textColor} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={1000}>
                {data.transactions_by_country.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Daily Orders (Line Chart) */}
      <div className="glass-card p-6 rounded-2xl flex flex-col h-96">
        <h3 className="text-md font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          Daily Orders Volume
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.daily_orders}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} />
              <YAxis stroke={textColor} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Error Distribution (Donut Chart) */}
      <div className="glass-card p-6 rounded-2xl flex flex-col h-96">
        <h3 className="text-md font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          Validation Error Types
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.error_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                animationDuration={1000}
              >
                {data.error_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: textColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
