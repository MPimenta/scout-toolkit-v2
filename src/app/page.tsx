import { SignInButton } from '@/components/auth/SignInButton';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scout Toolkit
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plataforma de Atividades Escutistas
          </p>
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            Explore atividades, crie programas e gere o seu grupo escutista de forma eficiente.
            Apenas para utilizadores com email @escoteiros.pt.
          </p>
          
          <div className="flex justify-center">
            <SignInButton />
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Explorar Atividades</h3>
              <p className="text-gray-600">
                Descubra centenas de atividades organizadas por categoria, duração e objetivos educativos.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Criar Programas</h3>
              <p className="text-gray-600">
                Construa programas personalizados com atividades e blocos personalizados.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Exportar e Partilhar</h3>
              <p className="text-gray-600">
                Exporte programas em Excel ou PDF e partilhe com outros líderes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
