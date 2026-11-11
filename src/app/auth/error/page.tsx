'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Acesso negado. Apenas associados da organização podem aceder.';
      case 'Configuration':
        return 'Erro de configuração do servidor. Contacta o administrador.';
      case 'Verification':
        return 'Erro de verificação. Tenta novamente.';
      default:
        return 'Ocorreu um erro durante a autenticação. Tenta novamente.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Erro de Autenticação
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md text-primary-foreground bg-primary hover:bg-blue-dark"
            >
              Tentar Novamente
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/home"
              className="text-sm text-primary hover:text-teal-dark"
            >
              Voltar à Página Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Carregando...
          </h2>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
