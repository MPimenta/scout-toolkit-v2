import { SignInButton } from '@/components/SignInButton';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sessão
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acede à plataforma Kit de Atividades
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <SignInButton />
          </div>
          <div className="text-center text-sm text-gray-600">
            <p>Apenas utilizadores com email @escoteiros.pt podem aceder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

