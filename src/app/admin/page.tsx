export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Painel de Administração
        </h1>
        <p className="text-lg text-gray-600">
          Gere conteúdo e configurações da plataforma
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Funcionalidade em Desenvolvimento
          </h2>
          <p className="text-gray-600">
            O painel de administração está a ser desenvolvido. Em breve poderás gerir atividades, utilizadores e configurações.
          </p>
        </div>
      </div>
    </div>
  );
}

