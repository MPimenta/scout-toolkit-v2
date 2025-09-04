'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Plus, Calendar, Clock, Users, Target, FileText, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { ProgramCard } from './ProgramCard';
import { ProgramForm } from './ProgramForm';
import { SignInButton } from '@/components/auth/SignInButton';

export function ProgramsList() {
  const { data: session, status } = useSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { programs, loading, error, pagination, refetch } = usePrograms();
  const { deleteProgram } = useProgramMutations();

  const handleDelete = async (programId: string) => {
    try {
      await deleteProgram(programId);
      refetch();
    } catch (err) {
      console.error('Error deleting program:', err);
    }
  };

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Show feature showcase for non-logged users
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Criador de Programas</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Organize e planeie atividades escoteiras com ferramentas profissionais. 
            Crie cronogramas detalhados, adicione atividades e gere programas completos.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Cronogramas Inteligentes</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Crie cronogramas detalhados com cálculo automático de tempos e organização visual clara.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Gestão de Atividades</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Adicione atividades do catálogo ou crie blocos personalizados para o seu programa.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Objetivos Educativos</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Acompanhe objetivos educativos e ODS para cada programa criado.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Exportação Profissional</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Exporte programas para PDF e Excel com formatação profissional.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Templates Reutilizáveis</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Guarde e reutilize programas como templates para futuras atividades.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Partilha Colaborativa</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                Partilhe programas com outros líderes e colabore em projetos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Comece a Criar Programas Profissionais
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Junte-se a outros líderes escoteiros que já estão a usar esta plataforma 
              para criar programas de qualidade e organizar atividades de forma profissional.
            </p>
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  // Show full CRUD interface for logged users
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Programas</h1>
          <p className="text-muted-foreground">
            Crie e organize programas personalizados para os seus escoteiros.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <ProgramForm
            mode="create"
            onSuccess={() => {
              setShowCreateForm(false);
              refetch(); // Refresh the programs list to show the new program
            }}
          />
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : programs.length === 0 ? (
        <Card className="text-center p-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Ainda não tem programas</CardTitle>
          <CardContent className="p-0">
            <p className="text-muted-foreground mb-4">
              Crie o seu primeiro programa para começar a organizar atividades.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Programa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onDelete={() => handleDelete(program.id)}
              />
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} programas
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
