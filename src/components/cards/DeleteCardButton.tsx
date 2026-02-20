'use client';

import { useTransition } from "react";
import { deleteCreditCard } from "@/lib/actions/credit-card-actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteCardButton({ cardId }: { cardId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Tem certeza? Isso apagará todas as faturas e gastos deste cartão permanentemente.")) return;

    startTransition(async () => {
      const result = await deleteCreditCard(cardId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isPending}
      className="h-8 w-8 text-destructive hover:bg-destructive/10"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}