export function ProblemSection() {
  return (
    <section className="bg-red-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-100 border border-red-200 rounded-full px-4 py-2 mb-6">
            <span className="text-red-600 text-sm">⚠️ Problemas Reais das Instituições</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Sua instituição está perdendo alunos por{" "}
            <span className="text-red-600">falhas no atendimento?</span>
          </h2>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Problem 1 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">🕐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Atendimento lento perde matrículas.
            </h3>
            <p className="text-gray-600 text-sm">
              Resposta lenta? O aluno vai para a concorrência.
            </p>
          </div>

          {/* Problem 2 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Equipe perdida e sobrecarregada
            </h3>
            <p className="text-gray-600 text-sm">
              Sem processos, a equipe erra mais e vende menos.
            </p>
          </div>

          {/* Problem 3 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Leads perdidos em conversas soltas.
            </h3>
            <p className="text-gray-600 text-sm">
              Informações perdidas, vendas perdidas.
            </p>
          </div>

          {/* Problem 4 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">🏠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Home office sem controle para prejuízo.
            </h3>
            <p className="text-gray-600 text-sm">
              Impossível saber quem está realmente produzindo.
            </p>
          </div>

          {/* Problem 5 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">📉</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Tráfego caro, conversão baixa
            </h3>
            <p className="text-gray-600 text-sm">
              Você atrai bem, mas perde no atendimento.
            </p>
          </div>

          {/* Problem 6 */}
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Sem automação, time trava e aluno desiste.
            </h3>
            <p className="text-gray-600 text-sm">
              Repetição cansa, atrasa e afasta a matrícula.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            A verdade é simples: sem comunicação rápida e 
            inteligente, sua instituição perde matrículas todos os 
            dias silenciosamente.
          </h3>
          <p className="text-red-100 text-lg">
            Cada minuto de demora é uma oportunidade perdida.
          </p>
        </div>
      </div>
    </section>
  )
}