'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Paperclip, Calendar, Wallet, Tags as TagsIcon, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ViewTransactionModal({ transaction }: { transaction: any }) {
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';
  const isProjected = transaction.isProjected;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value)); // Usa o absoluto pois o sinal já é indicado pela cor
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Ver Detalhes" className="hover:bg-accent transition-colors">
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Movimentação
            {isProjected && <Badge variant="secondary" className="ml-2 text-xs">Previsto</Badge>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Cabeçalho: Valor e Descrição */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-dashed">
            <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
              isTransfer ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 
              isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 
              'bg-red-100 text-red-600 dark:bg-red-900/30'
            }`}>
              {isTransfer ? <ArrowRightLeft className="h-6 w-6" /> : isIncome ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <h3 className="text-xl font-bold text-center">{transaction.description}</h3>
            <p className={`text-3xl font-extrabold tracking-tight ${
              isTransfer ? 'text-blue-500' : isIncome ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {isTransfer ? '' : isIncome ? '+ ' : '- '}{formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Grade de Informações */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</span>
                <p className="text-sm font-medium">{format(new Date(transaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
             </div>

             <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Conta</span>
                <p className="text-sm font-medium">{transaction.account?.name || 'Não informada'}</p>
             </div>

             <div className="space-y-1 col-span-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <span className="text-base leading-none">{transaction.category?.icon || '📌'}</span> Categoria
                </span>
                <p className="text-sm font-medium">{transaction.category?.name || 'Sem Categoria'}</p>
             </div>

             {/* Tags / Subgrupos */}
             {transaction.tags && transaction.tags.length > 0 && (
               <div className="space-y-2 col-span-2 pt-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><TagsIcon className="h-3 w-3" /> Subgrupos (Tags)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {transaction.tags.map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="font-normal capitalize">#{tag.name}</Badge>
                    ))}
                  </div>
               </div>
             )}
          </div>

          {/* Seção de Anexo */}
          {transaction.attachments && transaction.attachments.length > 0 && (
             <div className="border rounded-lg p-3 mt-4 bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Paperclip className="h-3 w-3" /> Comprovante Anexado
                </span>
                {transaction.attachments.map((file: any) => (
                   <div key={file.id} className="flex items-center justify-between bg-background border rounded p-2">
                      <span className="text-xs truncate max-w-[200px]" title={file.fileName}>{file.fileName}</span>
                      <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                         {/* Aqui chamamos a rota de API que criamos para baixar/ver o arquivo do banco */}
                         <a href={`/api/attachments/${file.id}`} target="_blank" rel="noopener noreferrer">Visualizar</a>
                      </Button>
                   </div>
                ))}
             </div>
          )}

        </div>
        
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}