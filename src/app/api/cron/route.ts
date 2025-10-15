// src/app/api/cron/route.ts
import { NextResponse } from 'next/server';
import { processRecurringTransactions } from '@/lib/recurring';

export async function GET(request: Request) {
  // 1. Proteja o endpoint com um segredo
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Execute a função de processamento
  try {
    const result = await processRecurringTransactions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Cron job falhou:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}