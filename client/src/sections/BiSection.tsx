export function BiSection() {
  return (
    <section className="bg-gray-900 py-20 px-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-6">
            <span className="text-blue-400 text-sm">📊 Business Intelligence</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Controle completo da produtividade da sua equipe,{" "}
            <span className="text-blue-400">com acesso remoto seguro e em tempo real.</span>
          </h2>
          
          <p className="text-gray-300 text-lg max-w-4xl mx-auto leading-relaxed">
            Com o BI do EduChat, monitore em tempo real as métricas que impulsionam sua 
            operação educacional.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Metrics */}
          <div className="space-y-4">
            {/* Metric 1 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⏱️</span>
                  </div>
                  <span className="text-gray-300 text-sm">Tempo de resposta e tempo médio por conversa</span>
                </div>
                <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded">< 2min</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <span className="text-gray-300 text-sm">Relatórios de desempenho por atendente</span>
                </div>
                <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">Real-time</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚠️</span>
                  </div>
                  <span className="text-gray-300 text-sm">Alerta automático de inatividade</span>
                </div>
                <span className="text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded">INSTANTÂNEO</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📈</span>
                  </div>
                  <span className="text-gray-300 text-sm">Relatórios diários, semanais e mensais</span>
                </div>
                <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-1 rounded">Automático</span>
              </div>
            </div>

            {/* Metric 5 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚖️</span>
                  </div>
                  <span className="text-gray-300 text-sm">Comparação entre membros da equipe</span>
                </div>
                <span className="text-orange-400 text-xs bg-orange-500/20 px-2 py-1 rounded">Detalhado</span>
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard Preview */}
          <div className="relative">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Dashboard em Tempo Real</h3>
              </div>
              
              {/* Dashboard Content */}
              <div className="aspect-video bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl flex items-center justify-center relative overflow-hidden border border-gray-600">
                {/* Stats Display */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-green-400 text-2xl font-bold">94%</div>
                      <div className="text-gray-400 text-xs">Taxa de Resposta</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 text-2xl font-bold">1.8s</div>
                      <div className="text-gray-400 text-xs">Tempo Médio</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full text-center">
                    🕐 Dados em Tempo Real
                  </div>
                </div>
                
                {/* Background Elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 inline-block">
            <h3 className="text-2xl font-bold mb-2">Lidere com dados, motive com clareza.</h3>
            <p className="text-blue-100">Sua gestão educacional mais estratégica e eficiente.</p>
          </div>
        </div>
      </div>
    </section>
  )
}