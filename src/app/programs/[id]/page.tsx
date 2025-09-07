'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Calendar, Clock, Users, Target, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProgram } from '@/hooks/useProgram';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { DeleteProgramModal } from '@/components/features/programs/DeleteProgramModal';
import { useState } from 'react';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const programId = params['id'] as string;
  const { program, loading, error } = useProgram(programId);
  const { deleteProgram } = useProgramMutations();

  const handleDelete = async () => {
    try {
      await deleteProgram(programId);
      router.push('/programs');
    } catch (err) {
      console.error('Error deleting program:', err);
    }
  };

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
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar programa</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/programs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Programas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Programa não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O programa que está a procurar não existe ou não tem acesso.
            </p>
            <Button onClick={() => router.push('/programs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Programas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/programs')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Programas
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
              <p className="text-muted-foreground">
                Criado por {program.user.name}
              </p>
            </div>

            {session?.user?.id === program.user.id && (
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button variant="outline" asChild>
                  <a href={`/programs/${program.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/programs/${program.id}/builder`}>
                    <Target className="h-4 w-4 mr-2" />
                    Builder
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Program Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(program.date || null)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hora de Início</p>
                  <p className="font-medium">{formatTime(program.start_time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="font-medium">{program.summary.entry_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="font-medium">
                    {formatDuration(program.summary.total_duration_minutes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Program Entries */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cronograma do Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.entries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Este programa ainda não tem atividades ou blocos adicionados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {program.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                      {entry.position}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                                                 <h4 className="font-medium">
                           {entry.entry_type === 'activity' && entry.activity
                             ? entry.activity.name
                             : entry.custom_title || 'Bloco Personalizado'
                           }
                         </h4>
                        <Badge variant={entry.entry_type === 'activity' ? 'default' : 'secondary'}>
                          {entry.entry_type === 'activity' ? 'Atividade' : 'Personalizado'}
                        </Badge>
                      </div>
                      
                      {entry.entry_type === 'activity' && entry.activity && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Duração: {entry.activity.approximate_duration_minutes}min</p>
                          <p>Grupo: {entry.activity.group_size} | Esforço: {entry.activity.effort_level}</p>
                          <p>Localização: {entry.activity.location}</p>
                        </div>
                      )}
                      
                      {entry.entry_type === 'custom' && entry.custom_duration_minutes && (
                        <p className="text-sm text-muted-foreground">
                          Duração: {entry.custom_duration_minutes}min
                        </p>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground text-right">
                      <p>{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Programa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Objetivos Educativos</h4>
                                 {program.summary.educational_goals.length > 0 ? (
                   <div className="space-y-1">
                     {program.summary.educational_goals.map((goal) => (
                       <Badge key={goal.id} variant="outline" className="mr-2 mb-2">
                         {goal.code}: {goal.title}
                       </Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-muted-foreground">Nenhum objetivo educativo definido</p>
                 )}
               </div>
               
               <div>
                 <h4 className="font-medium mb-2">Objetivos de Desenvolvimento Sustentável</h4>
                 {program.summary.sdgs.length > 0 ? (
                   <div className="space-y-1">
                     {program.summary.sdgs.map((sdg) => (
                       <Badge key={sdg.id} variant="outline" className="mr-2 mb-2">
                         ODS {sdg.number}: {sdg.name}
                       </Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-muted-foreground">Nenhum ODS definido</p>
                 )}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteProgramModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        programName={program.name}
      />
    </>
  );
}
