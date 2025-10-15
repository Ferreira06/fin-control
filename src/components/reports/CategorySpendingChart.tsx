// src/components/reports/CategorySpendingChart.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ChartData = { month: string; expensesByCategory: { [key: string]: number }; }[];
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export function CategorySpendingChart({ data, topCategories }: { data: ChartData, topCategories: string[] }) {
  const chartData = data.map(monthData => {
    const monthEntry: { [key: string]: string | number } = { month: monthData.month };
    topCategories.forEach(category => {
      monthEntry[category] = monthData.expensesByCategory[category] || 0;
    });
    return monthEntry;
  });

  return (
    <Card>
      <CardHeader><CardTitle>Evolução de Gastos (Top 5 Categorias)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            {topCategories.map((category, index) => (
              <Area key={category} type="monotone" dataKey={category} stackId="1" stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}