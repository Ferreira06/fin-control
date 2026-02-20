'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addCategory, deleteCategory, addTag, deleteTag } from '@/lib/actions';
import { Category, Tag } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, SmilePlus, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMOJI_GROUPS = [ { name: "Finanças & Essenciais", emojis: ['💸', '💰', '💳', '🏦', '🧾', '💵', '💶', '💷', '💎', '⚖️', '💲', '🪙', '🏧', '🐷', '💼', '📂', '📉', '📈', '📊', '📌'] }, { name: "Moradia & Contas", emojis: ['🏠', '🏡', '🏢', '🛋️', '🛏️', '🚽', '🚿', '💡', '🔌', '💧', '🔥', '📺', '🌐', '📞', '🔋', '🔨', '🔧', '🧹', '🗑️', '🧺'] }, { name: "Alimentação & Mercado", emojis: ['🛒', '🛍️', '🍔', '🍕', '🍣', '🍱', '🍜', '🥩', '🍗', '🥦', '🥕', '🌽', '🍅', '🍎', '🍌', '🍇', '☕', '🍵', '🍺', '🍷', '🍴', '🍽️'] }, { name: "Transporte & Veículos", emojis: ['🚗', '🚘', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚚', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚂', '🚆', '✈️', '🛫', '🚁', '🛳️', '🚤', '⛽', '🅿️', '🔧'] }, { name: "Saúde & Bem-estar", emojis: ['🏥', '🚑', '🩺', '💊', '💉', '🩸', '🩹', '🦷', '🦴', '🧠', '💪', '🦵', '🦶', '🧘‍♀️', '🏋️‍♂️', '🏊‍♂️', '⛹️‍♂️', '🛀', '🧴', '🪒'] }, { name: "Lazer & Educação", emojis: ['🎮', '🕹️', '🎲', '🎯', '🎳', '🎬', '🎟️', '🎫', '🎭', '🎨', '🎪', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎸', '📚', '📕', '🎓', '🎒', '🏫'] }, { name: "Outros & Pessoais", emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🎁', '🎀', '👶', '👧', '👨', '👩', '👴', '👵', '👕', '👖', '👗', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '👓', '🕶️', '💍', '🌂'] } ];

function SubmitButton({ label = 'Criar' }: { label?: string }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full md:w-auto h-10 font-semibold shrink-0">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : label}
      </Button>
    );
}

// Sub-componente para gerenciar as Tags de uma Categoria
function ManageTagsModal({ category }: { category: Category & { tags: Tag[] } }) {
  const [state, formAction] = useActionState(addTag, { success: false, message: '' });
  const [deleteState, deleteAction] = useActionState(deleteTag, { success: false, message: '' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) { toast.success(state.message); formRef.current?.reset(); } 
      else toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (deleteState.message) {
      if (deleteState.success) toast.success(deleteState.message);
      else toast.error(deleteState.message);
    }
  }, [deleteState]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Tags className="h-3.5 w-3.5" />
          {category.tags.length} Subgrupos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {category.icon} Subgrupos de {category.name}
          </DialogTitle>
        </DialogHeader>
        
        <form ref={formRef} action={formAction} className="flex gap-2 mt-4">
          <input type="hidden" name="categoryId" value={category.id} />
          <Input name="name" placeholder="Nova tag (ex: Uber, iFood...)" required />
          <SubmitButton label="Adicionar" />
        </form>

        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
          {category.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tag criada.</p>
          ) : (
            category.tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-2 border rounded-md">
                <span className="text-sm font-medium"># {tag.name}</span>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={tag.id} />
                  <Button type="submit" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ... (MANTENHA A CategoryDeleteForm AQUI COMO ESTAVA ANTES) ...
function CategoryDeleteForm({ categoryId }: { categoryId: string }) {
  const [state, formAction] = useActionState(deleteCategory, { success: false, message: '' });
  useEffect(() => { if (state.message) { if (state.success) toast.success(state.message); else toast.error(state.message); } }, [state]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={categoryId} />
      <Button type="submit" variant="ghost" size="icon" title="Excluir Categoria" className="hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button>
    </form>
  );
}

// TIPO ATUALIZADO
export function CategoryManager({ initialCategories }: { initialCategories: (Category & { tags: Tag[] })[] }) {
  const [state, formAction] = useActionState(addCategory, { success: false, message: '' });
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('📌');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (state.message) {
      if (state.success) { toast.success(state.message); formRef.current?.reset(); setSelectedEmoji('📌'); } 
      else toast.error(state.message);
    }
  }, [state]);

  return (
    <CardContent className="pt-6">
      {/* ... (MANTENHA O FORMULÁRIO DE CRIAÇÃO EXATAMENTE COMO ESTAVA) ... */}
      <div className="bg-muted/30 p-5 rounded-xl border mb-8">
        <h3 className="text-base font-semibold mb-5 flex items-center gap-2">✨ Nova Categoria</h3>
        <form ref={formRef} action={formAction} className="flex flex-col md:flex-row md:items-end gap-4 w-full">
          <input type="hidden" name="icon" value={selectedEmoji} />
          {/* 1. Seletor de Emoji */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto shrink-0">
            <label className="text-xs font-medium text-muted-foreground ml-1">Ícone</label>
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button" className={cn("h-10 w-full md:w-16 text-2xl flex items-center justify-center p-0 border-dashed transition-all", isEmojiPickerOpen && "border-primary bg-accent")}>{selectedEmoji}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                 <div className="p-3 border-b bg-muted/30 flex items-center gap-2 text-sm font-medium"><SmilePlus className="h-4 w-4 text-primary" /> Galeria de Ícones</div>
                 <div className="h-80 overflow-y-auto p-4 scroll-smooth">
                    {EMOJI_GROUPS.map((group) => (
                      <div key={group.name} className="mb-6 last:mb-0">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider px-1">{group.name}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {group.emojis.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => { setSelectedEmoji(emoji); setIsEmojiPickerOpen(false); }} className={cn("text-2xl h-9 w-9 rounded-md flex items-center justify-center transition-all hover:scale-110 hover:bg-accent", selectedEmoji === emoji && "bg-primary/20 ring-2 ring-primary ring-offset-1")}>{emoji}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                 </div>
              </PopoverContent>
            </Popover>
          </div>
          {/* 2. Input de Nome */}
          <div className="flex flex-col gap-1.5 w-full flex-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Nome da Categoria</label>
            <Input name="name" placeholder="Ex: Aluguel, Mercado, Investimentos..." className="h-10" required />
          </div>
          {/* 3. Seletor de Tipo */}
          <div className="flex flex-col gap-1.5 w-full md:w-56 shrink-0">
            <label className="text-xs font-medium text-muted-foreground ml-1">Tipo de Fluxo</label>
            <Select name="type" required defaultValue="EXPENSE">
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" /> Despesa (Saída)</div></SelectItem>
                <SelectItem value="INCOME"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Receita (Entrada)</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SubmitButton label="Criar Categoria" />
        </form>
      </div>

      {/* Listagem de Categorias com Coluna de Tags */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[70px] text-center">Ícone</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tags</TableHead> {/* NOVA COLUNA AQUI */}
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCategories.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><div className="flex flex-col items-center gap-2"><SmilePlus className="h-8 w-8 opacity-50" /><p>Nenhuma categoria cadastrada ainda.</p></div></TableCell></TableRow>
            ) : (
              initialCategories.map((category) => (
                <TableRow key={category.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="text-3xl text-center py-3">{category.icon}</TableCell>
                  <TableCell className="font-medium text-base">{category.name}</TableCell>
                  <TableCell>
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5", category.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                      <div className={cn("h-1.5 w-1.5 rounded-full", category.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500')} />
                      {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </span>
                  </TableCell>
                  
                  {/* BOTAO DE GERENCIAR TAGS */}
                  <TableCell>
                     <ManageTagsModal category={category} />
                  </TableCell>

                  <TableCell className="text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CategoryDeleteForm categoryId={category.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  );
}