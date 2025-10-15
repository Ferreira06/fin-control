// file: src/components/dashboard/AiInsightsCard.tsx
'use client';

import { useState, useTransition } from 'react';
import { generateInsightsAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";
import { Button } from '../ui/button';

export function AiInsightsCard() {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerateInsights = () => {
    startTransition(async () => {
      const result = await generateInsightsAction();
      if (result.error) {
        setError(result.error);
        setInsights(null);
      } else if (result.insights) {
        setInsights(result.insights);
        setError(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>Insights da IA</CardTitle>
        </div>
        <CardDescription>Peça uma análise rápida da sua vida financeira.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground animate-pulse">Gerando insights...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : insights ? (
          <ul className="space-y-2 text-sm list-disc pl-5">
            {insights.map((insight, index) => <li key={index}>{insight}</li>)}
          </ul>
        ) : (
           <p className="text-sm text-muted-foreground">Clique no botão para gerar uma análise.</p>
        )}
        
        <Button
          onClick={handleGenerateInsights}
          disabled={isPending}
          className="w-full mt-4"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isPending ? 'Analisando...' : 'Gerar Insights Agora'}
        </Button>
      </CardContent>
    </Card>
  );
}