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
        return 'Acesso negado. Apenas utilizadores com email @escoteiros.pt podem aceder.';
      case 'Configuration':
        return 'Erro de configuração do servidor. Contacta o administrador.';
      case 'Verification':
        return 'Erro de verificação. Tenta novamente.';
      default:
        return 'Ocorreu um erro durante a autenticação. Tenta novamente.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Erro de Autenticação
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/home"
              className="text-sm text-blue-600 hover:text-blue-500"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Carregando...
          </h2>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
