'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Program } from '@/hooks/usePrograms';
import { DeleteProgramModal } from './DeleteProgramModal';

/**
 * Props for the ProgramCard component
 */
interface ProgramCardProps {
  program: Program;
  onDelete?: (id: string) => void;
}

/**
 * ProgramCard component that displays program information in a card format
 * @param program - The program data to display
 * @param onDelete - Optional callback function when program is deleted
 * @returns JSX element representing the program card
 */
export function ProgramCard({ program, onDelete }: ProgramCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Formats duration in minutes to a human-readable string
   * @param minutes - Duration in minutes
   * @returns Formatted duration string (e.g., "2h 30min" or "45min")
   */
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim();
    }
    return `${mins}min`;
  };

  /**
   * Formats a date string for display
   * @param dateString - The date string to format (can be null)
   * @returns Formatted date string or fallback message
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não definida';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(program.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {program.name}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link href={`/programs/${program.id}`}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver programa</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link href={`/programs/${program.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar programa</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar programa</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(program.date)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Início: {formatTime(program.start_time)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{program.entry_count} entradas</span>
            </div>

            {program.total_duration_minutes > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duração: {formatDuration(program.total_duration_minutes)}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {program.is_public && (
                <Badge variant="secondary">Público</Badge>
              )}
              <Badge variant="outline">
                {program.entry_count > 0 ? 'Com atividades' : 'Vazio'}
              </Badge>
            </div>
            
            <Button asChild size="sm" className="ml-auto">
              <Link href={`/programs/${program.id}`}>
                Ver Detalhes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteProgramModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        programName={program.name}
      />
    </>
  );
}
