import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar, Users, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Ferramentas para{' '}
            <span className="text-primary">Líderes Escoteiros</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground max-w-3xl mx-auto">
            Navegue por centenas de atividades, crie programas personalizados e 
            ajude os seus escuteiros a crescer com experiências significativas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/activities">
                Explorar Atividades
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/programs">
                Criar Programa
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo o que precisa para ser um líder melhor
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Atividades</CardTitle>
                <CardDescription>
                  Encontre atividades por idade, duração, localização e objetivos educativos
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Programas</CardTitle>
                <CardDescription>
                  Crie e organize programas completos com cronogramas detalhados
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Colaboração</CardTitle>
                <CardDescription>
                  Partilhe programas com outros líderes e inspire-se em ideias
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Recursos</CardTitle>
                <CardDescription>
                  Aceda a materiais, instruções e dicas para cada atividade
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a outros líderes que já estão a usar o Scout Toolkit
          </p>
          <Button asChild size="lg">
            <Link href="/activities">
              Começar Agora
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
