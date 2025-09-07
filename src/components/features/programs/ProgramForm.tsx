'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useProgramMutations, CreateProgramData, UpdateProgramData } from '@/hooks/useProgramMutations';
import { log } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';

/**
 * Props for the ProgramForm component
 */
interface ProgramFormProps {
  mode: 'create' | 'edit';
  initialData?: UpdateProgramData & { id: string };
  onSuccess?: () => void;
}

/**
 * ProgramForm component for creating and editing programs
 * Provides a form interface for program data entry and validation
 * @param mode - The form mode (create or edit)
 * @param initialData - Initial data for editing mode
 * @param onSuccess - Optional callback when form submission is successful
 * @returns JSX element representing the program form
 */
export function ProgramForm({ mode, initialData, onSuccess }: ProgramFormProps) {
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ mode, initialData, onSuccess }, specificSchemas.programForm, 'ProgramForm');
  }
  const { createProgram, updateProgram, loading, error, clearError } = useProgramMutations();
  
  const [formData, setFormData] = useState<CreateProgramData>({
    name: '',
    date: '',
    start_time: '09:00',
    is_public: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        date: initialData.date || '',
        start_time: initialData.start_time || '',
        is_public: initialData.is_public || false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === 'create') {
        await createProgram(formData);
        // Call onSuccess to close form and update UI instead of redirecting
        onSuccess?.();
      } else if (mode === 'edit' && initialData?.id) {
        await updateProgram(initialData.id, formData);
        onSuccess?.();
      }
    } catch (err) {
      // Error is handled by the hook
      log.error('Form submission error', err as Error);
    }
  };

  const handleCancel = () => {
    onSuccess?.();
  };

  const isFormValid = formData.name.trim() && formData.start_time;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? 'Criar Novo Programa' : 'Editar Programa'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Programa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Acampamento de Verão"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data (opcional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Início *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
            <Label htmlFor="is_public">Tornar programa público</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Criar Programa' : 'Guardar Alterações'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
