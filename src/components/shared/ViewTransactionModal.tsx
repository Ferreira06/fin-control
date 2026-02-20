'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Paperclip, Calendar, Wallet, Tags as TagsIcon, ArrowRightLeft, TrendingDown, TrendingUp, ExternalLink, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ViewTransactionModal({ transaction }: { transaction: any }) {
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';
  const isProjected = transaction.isProjected;

  // Lógica para detectar se é Cartão de Crédito ou Conta
  const isCreditCardTransaction = !!transaction.invoiceId;
  const sourceName = isCreditCardTransaction 
    ? transaction.invoice?.creditCard?.name || 'Cartão de Crédito' 
    : transaction.account?.name || 'Não informada';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value)); 
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Ver Detalhes" className="hover:bg-accent transition-colors">
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      {/* Adicionado max-h-[90vh] e overflow-y-auto para rolar anexos grandes */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data
                </span>
                <p className="text-sm font-medium">{format(new Date(transaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
             </div>

             <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  {isCreditCardTransaction ? <CreditCard className="h-3 w-3" /> : <Wallet className="h-3 w-3" />} 
                  {isCreditCardTransaction ? 'Cartão' : 'Conta'}
                </span>
                <p className="text-sm font-medium">{sourceName}</p>
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
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <TagsIcon className="h-3 w-3" /> Subgrupos (Tags)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {transaction.tags.map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="font-normal capitalize">#{tag.name}</Badge>
                    ))}
                  </div>
               </div>
             )}
          </div>

          {/* Seção de Anexo Embutido */}
          {transaction.attachments && transaction.attachments.length > 0 && (
             <div className="border rounded-lg p-3 mt-4 bg-muted/10 space-y-3">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> Comprovante Anexado
                </span>
                
                {transaction.attachments.map((file: any) => {
                   const fileUrl = `/api/attachments/${file.id}`;
                   // Detecta se é imagem ou PDF para embutir corretamente
                   const isImage = file.mimeType?.startsWith('image/');
                   const isPdf = file.mimeType === 'application/pdf';

                   return (
                     <div key={file.id} className="flex flex-col gap-0 shadow-sm">
                        {/* Header do Arquivo com Botão Externo */}
                        <div className="flex items-center justify-between bg-background border rounded-t-md p-2 border-b-0">
                           <span className="text-xs truncate max-w-[200px] font-medium" title={file.fileName}>
                             {file.fileName}
                           </span>
                           <Button asChild size="sm" variant="secondary" className="h-7 text-xs flex items-center gap-1">
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                 <ExternalLink className="h-3 w-3" />
                                 Abrir Guia
                              </a>
                           </Button>
                        </div>

                        {/* Visualizador Embutido (Preview) */}
                        <div className="flex justify-center items-center bg-muted/30 border rounded-b-md overflow-hidden min-h-[150px]">
                           {isImage ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img 
                               src={fileUrl} 
                               alt={file.fileName} 
                               className="max-h-[350px] w-full object-contain"
                             />
                           ) : isPdf ? (
                             // iframe com #toolbar=0 esconde os menus nativos do leitor de pdf do navegador
                             <iframe 
                               src={`${fileUrl}#toolbar=0&navpanes=0`} 
                               className="w-full h-[350px] border-none bg-white"
                               title={file.fileName}
                             />
                           ) : (
                             <div className="p-6 text-xs text-muted-foreground text-center">
                               Pré-visualização não disponível para este formato.<br/>
                               Clique em "Abrir Guia" acima.
                             </div>
                           )}
                        </div>
                     </div>
                   );
                })}
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