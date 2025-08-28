import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sessão</CardTitle>
          <CardDescription>
            Aceda à plataforma de atividades escutistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Apenas utilizadores com email @escoteiros.pt podem aceder
            </p>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
              Autenticação Temporariamente Indisponível
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>
              Ao iniciar sessão, concorda com os nossos{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
