import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Programas</h1>
        <p className="text-muted-foreground">
          Crie e organize programas personalizados para os seus escoteiros.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            A página de programas está a ser desenvolvida como parte do Epic 2.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Esta página irá incluir:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Criador de programas com drag & drop</li>
            <li>Cronogramas detalhados</li>
            <li>Partilha de programas</li>
            <li>Exportação para PDF e Excel</li>
            <li>Gestão de programas pessoais</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

