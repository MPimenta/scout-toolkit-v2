'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Activity {
  id: string;
  name: Record<string, string>;
  approximate_duration_minutes: number;
  group_size: 'small' | 'medium' | 'large';
}

interface AddToProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
}

interface Program {
  id: string;
  name: string;
  description?: string;
}

export function AddToProgramModal({ isOpen, onClose, activity }: AddToProgramModalProps) {
  const { data: session } = useSession();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock programs - TODO: Replace with real API call
  const userPrograms: Program[] = [
    { id: '1', name: 'Acampamento de Verão 2024', description: 'Programa de atividades para o acampamento de verão' },
    { id: '2', name: 'Reuniões Semanais', description: 'Atividades para as reuniões semanais da secção' },
  ];

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

  const getPortugueseText = (content: Record<string, string> | null | undefined): string => {
    if (!content) return '';
    return content.pt || content.en || Object.values(content)[0] || '';
  };

  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
                  {getPortugueseText(activity.name)}
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
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger id="program-select">
                    <SelectValue placeholder="Escolha um programa existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        <div>
                          <div className="font-medium">{program.name}</div>
                          {program.description && (
                            <div className="text-sm text-muted-foreground">
                              {program.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={!selectedProgram || isSubmitting}
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
