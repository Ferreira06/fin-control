'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { addCategory, deleteCategory, CategoryFormState, DeleteState } from '@/lib/actions';
import { Category } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending ? 'Adicionando...' : 'Adicionar Categoria'}
      </Button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="ghost" size="icon" disabled={pending} aria-label="Deletar">
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}

function CategoryDeleteForm({ categoryId }: { categoryId: string }) {
  const initialState: DeleteState = { success: false, message: '' };
  const [state, formAction] = useFormState(deleteCategory, initialState);

  useEffect(() => {
    if (!state.success && state.message) {
      alert(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={categoryId} />
      <DeleteButton />
    </form>
  );
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const initialState: CategoryFormState = { success: false, message: '' };
  const [state, formAction] = useFormState(addCategory, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <CardContent>
      {/* Formulário de Adicionar */}
      <form ref={formRef} action={formAction} className="flex items-start gap-4 mb-8">
        <div className="flex-grow space-y-2">
          <Input name="name" placeholder="Nome da nova categoria" required />
          {state.errors?.fieldErrors?.name && <p className="text-sm text-red-500">{state.errors.fieldErrors.name}</p>}
          {!state.success && state.message && <p className="text-sm text-red-500">{state.message}</p>}
          {state.success && state.message && <p className="text-sm text-green-500">{state.message}</p>}
        </div>
        <SubmitButton />
      </form>

      {/* Tabela de Categorias */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Categoria</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-right">
                  {/* CORREÇÃO: Usar o novo componente de formulário aqui */}
                  <CategoryDeleteForm categoryId={category.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  );
}