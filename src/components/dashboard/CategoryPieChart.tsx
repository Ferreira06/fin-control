// file: src/components/dashboard/CategoryPieChart.tsx

'use client';

import { Transaction, Category } from '@prisma/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TransactionWithCategory = Transaction & { category: Category };

interface CategoryPieChartProps {
  transactions: TransactionWithCategory[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

export function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const expenseData = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const categoryName = t.category.name;
      const existing = acc.find((item) => item.name === categoryName);
      if (existing) {
        existing.value += Math.abs(t.amount);
      } else {
        acc.push({ name: categoryName, value: Math.abs(t.amount) });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  if (expenseData.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center h-60">
                <p>Nenhuma despesa registrada este mês.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}