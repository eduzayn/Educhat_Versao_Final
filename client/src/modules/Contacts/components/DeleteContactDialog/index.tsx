import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { Contact } from "@shared/schema";

interface DeleteContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteContactDialog({
  contact,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteContactDialogProps) {
  const contactName = contact?.name || "contato";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir contato</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir{" "}
            <strong className="text-red-600">{contactName}</strong>? <br />
            Esta ação não pode ser desfeita. As conversas associadas serão
            mantidas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onClose}>
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Excluindo...
              </div>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}