import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Kit de Atividades
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Navega por centenas de atividades, cria programas personalizados e ajuda os teus escuteiros a crescer com experiências significativas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/activities"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Explorar Atividades
            </Link>
            <Link
              href="/programs"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Criar Programa
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Explorar Atividades</h3>
              <p className="text-gray-600">
                Encontra uma vasta gama de atividades escutistas com filtros para duração, grupo etário e muito mais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Criar Programas</h3>
              <p className="text-gray-600">
                Constrói horários de eventos combinando atividades e blocos personalizados com arrastar e largar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Exportar e Partilhar</h3>
              <p className="text-gray-600">
                Exporta os teus programas para Excel ou PDF e partilha-os com o teu grupo escutista.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

