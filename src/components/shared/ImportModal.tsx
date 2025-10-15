// file: src/components/shared/ImportModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef, useState } from 'react';
import { importTransactionsFromCSV, ImportFormState } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUp } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Processando...' : 'Importar Transações'}
    </Button>
  );
}

export function ImportModal() {
  const initialState: ImportFormState = { success: false, message: '' };
  const [state, formAction] = useActionState(importTransactionsFromCSV, initialState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Se a importação for bem sucedida, fecha o modal após um pequeno atraso
    if (state.success) {
      setTimeout(() => setOpen(false), 2000);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Importar transações">
          <FileUp className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Fatura CSV</DialogTitle>
          <DialogDescription>
            Envie sua fatura em formato CSV para adicionar as transações automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
            <Label htmlFor="csvFile">Arquivo CSV</Label>
            <Input id="csvFile" name="csvFile" type="file" accept=".csv" ref={fileInputRef} required />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
        {/* Feedback para o usuário */}
        {state.message && (
          <div className={`mt-4 text-sm p-2 rounded-md ${state.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>{state.message}</p>
            {state.importedCount && <p>{state.importedCount} transações foram adicionadas.</p>}
            {state.error && <p className='font-mono text-xs mt-2'>Detalhe: {state.error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}