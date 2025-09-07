'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Props for the DeleteProgramModal component
 */
interface DeleteProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  programName: string;
}

/**
 * DeleteProgramModal component for confirming program deletion
 * Provides a confirmation dialog with warning message
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback function to close the modal
 * @param onConfirm - Callback function to confirm deletion
 * @param programName - The name of the program being deleted
 * @returns JSX element representing the delete confirmation modal
 */
export function DeleteProgramModal({
  isOpen,
  onClose,
  onConfirm,
  programName,
}: DeleteProgramModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Programa
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem a certeza que deseja eliminar o programa <strong>&quot;{programName}&quot;</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e eliminará permanentemente o programa e todas as suas entradas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar Programa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
