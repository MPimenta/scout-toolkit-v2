'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { toast } from 'sonner';
import { log } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';

/**
 * Form data type for editing program metadata
 */
type EditProgramFormData = {
  name: string;
  date: string;
  start_time: string;
  is_public: boolean;
};

/**
 * Props for the EditProgramModal component
 */
interface EditProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: string;
    name: string;
    date?: string | null;
    start_time: string;
    is_public: boolean;
  };
  onSuccess?: () => void;
}

/**
 * EditProgramModal component for editing program metadata
 * Provides a form interface for updating program name, date, start time, and public status
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call when closing the modal
 * @param program - The program object to edit
 * @param onSuccess - Optional callback when edit is successful
 * @returns JSX element representing the edit program modal
 */
export function EditProgramModal({ isOpen, onClose, program, onSuccess }: EditProgramModalProps) {
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ isOpen, onClose, program, onSuccess }, specificSchemas.editProgramModal, 'EditProgramModal');
  }

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EditProgramFormData>({
    name: program.name,
    date: program.date || '',
    start_time: program.start_time,
    is_public: program.is_public,
  });
  const [errors, setErrors] = useState<Partial<EditProgramFormData>>({});
  const { updateProgram } = useProgramMutations();

  /**
   * Validates form data
   * @param data - The form data to validate
   * @returns Validation errors object
   */
  const validateForm = (data: EditProgramFormData): Partial<EditProgramFormData> => {
    const newErrors: Partial<EditProgramFormData> = {};
    
    if (!data.name.trim()) {
      newErrors.name = 'Nome do programa é obrigatório';
    } else if (data.name.length > 100) {
      newErrors.name = 'Nome muito longo';
    }
    
    if (!data.start_time) {
      newErrors.start_time = 'Hora de início é obrigatória';
    }
    
    return newErrors;
  };

  /**
   * Handles form submission and program update
   */
  const onSubmit = async () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      log.info('Updating program metadata', { programId: program.id, data: formData });
      
      await updateProgram(program.id, {
        name: formData.name,
        date: formData.date || undefined,
        start_time: formData.start_time,
        is_public: formData.is_public,
      });

      toast.success('Programa atualizado com sucesso!', {
        description: 'As alterações foram salvas.',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      log.error('Error updating program', error instanceof Error ? error : new Error(String(error)));
      toast.error('Erro ao atualizar programa', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles modal close and resets form
   */
  const handleClose = () => {
    setFormData({
      name: program.name,
      date: program.date || '',
      start_time: program.start_time,
      is_public: program.is_public,
    });
    setErrors({});
    onClose();
  };

  /**
   * Handles input changes
   * @param field - The field name to update
   * @param value - The new value
   */
  const handleInputChange = (field: keyof EditProgramFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Programa</DialogTitle>
          <DialogDescription>
            Atualize as informações básicas do programa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Programa</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome do programa"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data (opcional)</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={isLoading}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">Hora de Início</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              disabled={isLoading}
            />
            {errors.start_time && (
              <p className="text-sm text-destructive">{errors.start_time}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => handleInputChange('is_public', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="is_public">Programa público</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Programas públicos podem ser visualizados e usados como modelo por outros utilizadores.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
