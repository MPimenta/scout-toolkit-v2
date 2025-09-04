'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock, Users, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrograms } from '@/hooks/usePrograms';

interface Activity {
  id: string;
  name: string; // Now simple string after migration
  approximate_duration_minutes: number;
  group_size: 'small' | 'medium' | 'large';
}

interface AddToProgramModalProps {
  onClose: () => void;
  activity: Activity;
}

export function AddToProgramModal({ onClose, activity }: AddToProgramModalProps) {
  const { data: session } = useSession();
  const { programs, loading: programsLoading, error: programsError } = usePrograms();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddToProgram = async () => {
    if (!selectedProgram) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to add activity to program
      console.log('Adding activity to program:', {
        activityId: activity.id,
        programId: selectedProgram,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
      // TODO: Show success notification
    } catch (error) {
      console.error('Error adding activity to program:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to create new program
      console.log('Creating new program:', {
        name: newProgramName,
        description: newProgramDescription,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Add new program to list and select it
      setShowCreateProgram(false);
      setNewProgramName('');
      setNewProgramDescription('');
    } catch (error) {
      console.error('Error creating program:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar ao Programa</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Inicie sessão para adicionar atividades aos seus programas
            </p>
            <Button variant="outline">Iniciar Sessão</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="add-to-program-modal" data-activity-id={activity.id}>
        <DialogHeader>
          <DialogTitle>Adicionar ao Programa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividade Selecionada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  {activity.name}
                </h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {activity.approximate_duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {activity.group_size === 'small' ? '2-5' : 
                     activity.group_size === 'medium' ? '6-15' : '16+'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Selection */}
          {!showCreateProgram ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="program-select">Selecionar Programa</Label>
                {programsLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">A carregar programas...</span>
                  </div>
                ) : programsError ? (
                  <div className="p-3 border border-destructive/20 rounded-md bg-destructive/5">
                    <p className="text-sm text-destructive">Erro ao carregar programas: {programsError}</p>
                  </div>
                ) : programs && programs.length > 0 ? (
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger id="program-select">
                      <SelectValue placeholder="Escolha um programa existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div>
                            <div className="font-medium">{program.name}</div>
                            {program.date && (
                              <div className="text-sm text-muted-foreground">
                                {new Date(program.date).toLocaleDateString('pt-PT')}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 border border-muted rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground text-center">
                      Ainda não tem programas. Crie o seu primeiro programa!
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCreateProgram(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Programa
                </Button>
                
                <Button
                  onClick={handleAddToProgram}
                  disabled={!selectedProgram || isSubmitting || programsLoading || !programs || programs.length === 0}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {isSubmitting ? 'A adicionar...' : 'Adicionar ao Programa'}
                </Button>
              </div>
            </div>
          ) : (
            /* Create New Program Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="program-name">Nome do Programa</Label>
                <Input
                  id="program-name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="Ex: Acampamento de Verão 2024"
                />
              </div>
               
              <div>
                <Label htmlFor="program-description">Descrição (opcional)</Label>
                <Textarea
                  id="program-description"
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  placeholder="Descreva o programa..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCreateProgram(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                 
                <Button
                  onClick={handleCreateProgram}
                  disabled={!newProgramName.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'A criar...' : 'Criar Programa'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
