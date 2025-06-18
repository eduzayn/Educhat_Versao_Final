export function GuaranteeSection() {
  return (
    <section className="bg-green-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 mb-6">
            <span className="text-green-600 text-sm">🛡️ Garantia e Segurança</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Tranquilidade para Testar. <span className="text-green-600">Suporte que Resolve.</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            A educação é simples, rápida e fácil para garantir seus primeiros resultados com 
            segurança.
          </p>
        </div>

        {/* Guarantee Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-600 text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Sem fidelidade
            </h3>
            <p className="text-gray-600 text-sm">
              Cancele quando quiser, sem 
              burocracias.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-600 text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Ativação rápida
            </h3>
            <p className="text-gray-600 text-sm">
              Comece a usar em minutos, 
              sem complicações.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-600 text-2xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Uso intuitivo
            </h3>
            <p className="text-gray-600 text-sm">
              Interface simples para facilitar e 
              dar e sua.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-600 text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Processos ágil
            </h3>
            <p className="text-gray-600 text-sm">
              Tudo pensado para acelerar 
              suas matrículas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}