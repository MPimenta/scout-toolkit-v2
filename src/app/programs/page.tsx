export default function ProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Programas Escutistas
        </h1>
        <p className="text-lg text-gray-600">
          Cria e gere programas para os teus eventos escutistas
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Funcionalidade em Desenvolvimento
          </h2>
          <p className="text-gray-600">
            O construtor de programas está a ser desenvolvido. Em breve poderás criar, editar e exportar programas escutistas.
          </p>
        </div>
      </div>
    </div>
  );
}

