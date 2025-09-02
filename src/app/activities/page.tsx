'use client';

import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/features/activities/ActivityCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Filter, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { activities, total, loading, error } = useActivities({ search: searchTerm });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will be handled by the useActivities hook
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Atividades</h1>
          <p className="text-muted-foreground">
            Explore centenas de atividades para todas as idades e objetivos educativos.
          </p>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erro ao Carregar Atividades
            </CardTitle>
            <CardDescription>
              Ocorreu um erro ao tentar carregar as atividades. Por favor, tenta novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detalhes do erro: {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Atividades</h1>
        <p className="text-muted-foreground">
          Explore centenas de atividades para todas as idades e objetivos educativos.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </form>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {loading ? 'A carregar...' : `${total} atividade${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">A carregar atividades...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && activities.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Atividade Encontrada</CardTitle>
            <CardDescription>
              Não foram encontradas atividades com os critérios de pesquisa atuais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tenta ajustar os filtros de pesquisa ou contacta um administrador se acreditas que deveria haver atividades disponíveis.
            </p>
            <Button 
              onClick={() => setSearchTerm('')} 
              variant="outline"
            >
              Limpar Pesquisa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activities Grid */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Development Notice */}
      {!loading && activities.length > 0 && (
        <div className="mt-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Funcionalidade em Desenvolvimento</CardTitle>
              <CardDescription className="text-xs">
                Esta é a implementação inicial da página de atividades. Funcionalidades adicionais serão adicionadas em breve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Próximas funcionalidades: filtros avançados, pesquisa por texto, visualização em tabela, e sistema de avaliações.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

