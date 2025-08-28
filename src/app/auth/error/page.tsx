import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

export default function ErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error;

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'AccessDenied':
        return 'Acesso negado. Apenas utilizadores com email @escoteiros.pt podem aceder.';
      case 'Configuration':
        return 'Erro de configuração do servidor. Contacte o administrador.';
      case 'Verification':
        return 'Erro de verificação. Tente novamente.';
      default:
        return 'Ocorreu um erro durante a autenticação. Tente novamente.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Erro de Autenticação
          </CardTitle>
          <CardDescription>
            {error ? getErrorMessage(error) : 'Ocorreu um erro inesperado.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <Button asChild>
              <Link href="/auth/signin">
                Tentar Novamente
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                Voltar ao Início
              </Link>
            </Button>
          </div>
          
          {error === 'AccessDenied' && (
            <div className="text-center text-sm text-gray-600">
              <p>
                Se acredita que deveria ter acesso, contacte o administrador em{' '}
                <a href="mailto:admin@escoteiros.pt" className="text-blue-600 hover:underline">
                  admin@escoteiros.pt
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
