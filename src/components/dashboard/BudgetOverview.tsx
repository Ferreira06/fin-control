'use client';

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export function BudgetOverview({ budgets, spentByCategory }: { budgets: any[], spentByCategory: Record<string, number> }) {
  if (!budgets || budgets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" /> Metas de Gastos (Orçamentos)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {budgets.map((budget) => {
          const spent = Math.abs(spentByCategory[budget.categoryId] || 0);
          const percent = Math.min(100, (spent / budget.amount) * 100);
          const isOverBudget = spent > budget.amount;

          const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

          return (
            <div key={budget.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  {budget.category.icon} {budget.category.name}
                </span>
                <span className={isOverBudget ? "text-red-500 font-bold" : "text-muted-foreground"}>
                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <Progress value={percent} className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}