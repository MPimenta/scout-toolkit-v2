import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Atividades</h1>
        <p className="text-muted-foreground">
          Explore centenas de atividades para todas as idades e objetivos educativos.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            A página de atividades está a ser desenvolvida como parte do Epic 2.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Esta página irá incluir:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Lista de atividades com filtros avançados</li>
            <li>Pesquisa por texto e critérios</li>
            <li>Visualização em grelha e tabela</li>
            <li>Detalhes completos de cada atividade</li>
            <li>Sistema de avaliações e comentários</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

