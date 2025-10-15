// file: src/components/dashboard/DateFilter.tsx

'use client';

import * as React from 'react';
// A MUDANÇA ESTÁ AQUI 👇: Importar o ícone 'X'
import { CalendarIcon, X } from 'lucide-react';
import {format, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DateFilter({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: from ? new Date(from) : startOfMonth(new Date()),
    to: to ? new Date(to) : new Date(),
  });

  const handleDateSelect = (newDateRange: DateRange | undefined) => {
    setDate(newDateRange);
    const params = new URLSearchParams(searchParams);
    if (newDateRange?.from) {
      params.set('from', format(newDateRange.from, 'yyyy-MM-dd'));
    } else {
      params.delete('from');
    }
    if (newDateRange?.to) {
      params.set('to', format(newDateRange.to, 'yyyy-MM-dd'));
    } else {
      params.delete('to');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  // A MUDANÇA ESTÁ AQUI 👇: Função para limpar os parâmetros da URL
  const handleClearFilter = () => {
    // Reseta o estado visual do calendário para o padrão (mês atual)
    setDate({ from: startOfMonth(new Date()), to: new Date() });
    // Navega para a URL base, removendo todos os parâmetros de busca
    router.push(pathname, { scroll: false });
  };

  return (
    // A MUDANÇA ESTÁ AQUI 👇: Alterado de 'grid' para 'flex' para alinhar os botões horizontalmente
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {(from || to) && (
        <Button
          onClick={handleClearFilter}
          variant="ghost"
          size="icon"
          aria-label="Limpar filtro"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}