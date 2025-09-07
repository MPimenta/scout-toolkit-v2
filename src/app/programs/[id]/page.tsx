'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgram } from '@/hooks/useProgram';
import { ProgramBuilder } from '@/components/features/programs/ProgramBuilder';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const programId = params['id'] as string;
  const { program, loading, error, refetch } = useProgram(programId);

  const handleBack = () => {
    router.push('/programs');
  };

  const handleDelete = () => {
    router.push('/programs');
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
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar programa</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Programas
          </Button>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Programa não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O programa que está a procurar não existe ou não tem acesso.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Programas
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = session?.user?.id === program.user?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Programas
        </Button>
      </div>

      {/* Program Builder */}
      <ProgramBuilder
        programId={programId}
        program={program}
        initialEntries={program.entries || []}
        onSave={() => {}}
        onRefresh={refetch}
        onDelete={handleDelete}
        canEdit={canEdit}
      />
    </div>
  );
}