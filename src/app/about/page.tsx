import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Sobre o Scout Toolkit</h1>
        <p className="text-muted-foreground">
          Uma plataforma desenvolvida especificamente para os líderes dos Escoteiros de Portugal.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Missão</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              O Scout Toolkit nasceu da necessidade de fornecer aos líderes escoteiros 
              ferramentas digitais que facilitem o planeamento e execução de atividades 
              educativas de qualidade.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visão</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Queremos ser a plataforma de referência para líderes escoteiros em Portugal, 
              promovendo a partilha de conhecimento e boas práticas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              <li>Base de dados de atividades educativas</li>
              <li>Criador de programas personalizados</li>
              <li>Sistema de filtros e pesquisa avançada</li>
              <li>Partilha e colaboração entre líderes</li>
              <li>Exportação de programas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tecnologia</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Desenvolvido com tecnologias modernas como Next.js, TypeScript e PostgreSQL, 
              garantindo performance, segurança e facilidade de uso.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Desenvolvimento</CardTitle>
          <CardDescription>
            Este projeto é desenvolvido de forma aberta e colaborativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            O Scout Toolkit é um projeto open-source desenvolvido para a comunidade 
            dos Escoteiros de Portugal. Contribuições e sugestões são bem-vindas!
          </p>
          <div className="mt-4">
            <a 
              href="https://github.com/MPimenta/scout-toolkit-v2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ver no GitHub →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
