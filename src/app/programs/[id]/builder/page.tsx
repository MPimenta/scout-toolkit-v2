'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProgram } from '@/hooks/useProgram';
import { ProgramBuilder } from '@/components/features/programs/ProgramBuilder';
import { ProgramEntry } from '@/drizzle/schema/programs';
import { useState } from 'react';

export default function ProgramBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [savedEntries, setSavedEntries] = useState<ProgramEntry[]>([]);
  
  const programId = params.id as string;
  const { program, loading, error } = useProgram(programId);

  const handleSave = (entries: ProgramEntry[]) => {
    setSavedEntries(entries);
    // Show success message or redirect
    console.log('Program saved with entries:', entries);
  };

  const handleBack = () => {
    router.push(`/programs/${programId}`);
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
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Programa
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
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Programas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Deve estar autenticado para aceder a esta página.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user owns the program
  if (program.user_id !== session.user.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Só pode editar os seus próprios programas.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Programa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Programa
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Program Builder</h1>
            <p className="text-muted-foreground">
              Construir programa: {program.name}
            </p>
          </div>
        </div>
      </div>

      {/* Program Builder */}
      <ProgramBuilder
        programId={programId}
        initialEntries={savedEntries}
        onSave={handleSave}
      />
    </div>
  );
}
