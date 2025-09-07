'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProgram } from '@/hooks/useProgram';
import { ProgramForm } from '@/components/features/programs/ProgramForm';
import { log } from '@/lib/errors';

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const programId = params['id'] as string;
  const { program, loading, error } = useProgram(programId);

  const handleSuccess = () => {
    router.push(`/programs/${programId}`);
  };

  // Wait for both session and program to load
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          {status === 'loading' ? 'Carregando sessão...' : 'Carregando programa...'}
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Deve estar autenticado para editar programas.
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

  // Debug: Log the values being compared (only in browser)
  if (typeof window !== 'undefined') {
    log.debug('Edit program page debug info', {
      sessionStatus: status,
      sessionUserId: session?.user?.id,
      programLoading: loading,
      programError: error,
      programUserId: program?.user?.id
    });
  }

  // Ensure session and program data are available
  if (!session?.user?.id || !program?.user?.id) {
    log.error('Missing session or program user data', undefined, { 
      sessionStatus: status, 
      sessionData: session, 
      programLoading: loading, 
      programError: error, 
      programData: program 
    });
    
    // Show generic data error
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Erro de Dados</h2>
            <p className="text-muted-foreground mb-4">
              Erro ao carregar dados de utilizador ou programa.
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

  // Check if user owns this program
  if (session.user.id !== program.user.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Só pode editar programas que criou.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Debug: Session ID: {session?.user?.id} | Program User ID: {program.user?.id}
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/programs/${programId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Programa
        </Button>

        <h1 className="text-3xl font-bold mb-2">Editar Programa</h1>
        <p className="text-muted-foreground">
          Modifique as informações do seu programa.
        </p>
      </div>

      <ProgramForm
        mode="edit"
        initialData={{
          id: program.id,
          name: program.name,
          ...(program.date && { date: program.date }),
          start_time: program.start_time,
          is_public: program.is_public,
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
