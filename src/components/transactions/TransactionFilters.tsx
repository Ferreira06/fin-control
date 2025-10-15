// file: src/components/transactions/TransactionFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateFilter } from "../dashboard/DateFilter";

export function TransactionFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    // Se o valor for "all" ou vazio, remove o filtro da URL.
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reseta para a primeira página ao aplicar filtro
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    handleFilterChange('query', term);
  }, 300);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
      <Input
        placeholder="Buscar por descrição..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query') || ''}
        className="flex-grow"
      />
      <Select
        onValueChange={(value) => handleFilterChange('type', value)}
        defaultValue={searchParams.get('type') || 'all'}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="INCOME">Receita</SelectItem>
          <SelectItem value="EXPENSE">Despesa</SelectItem>
        </SelectContent>
      </Select>
      <DateFilter />
    </div>
  );
}