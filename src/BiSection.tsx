import { BarChart3, Clock, TrendingUp, AlertCircle, Users } from "lucide-react"

export function BiSection() {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-6">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Business Intelligence</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Controle completo da produtividade da sua equipe,{" "}
            <span className="text-blue-400">com acesso remoto seguro e em tempo real.</span>
          </h2>
          
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Com o BI do EduChat, monitore em tempo real as métricas que impulsionam sua 
            operação educacional.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Metrics */}
          <div className="space-y-6">
            {/* Metric 1 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Tempo de resposta e tempo médio por conversa</span>
                </div>
                <span className="text-blue-400 text-sm">< 2min</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Relatórios de desempenho por atendente</span>
                </div>
                <span className="text-green-400 text-sm">Real-time</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">Alerta automática de inatividade</span>
                </div>
                <span className="text-yellow-400 text-sm">INTELIGENTE</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Relatórios diários, semanais e mensais</span>
                </div>
                <span className="text-purple-400 text-sm">Automático</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-400 h-2 rounded-full" style={{width: '90%'}}></div>
              </div>
            </div>

            {/* Metric 5 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300">Comparação entre membros da equipe</span>
                </div>
                <span className="text-orange-400 text-sm">Detalhado</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-400 h-2 rounded-full" style={{width: '70%'}}></div>
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard Preview */}
          <div className="relative">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Dashboard em Tempo Real</h3>
                <div className="flex gap-4">
                  <div className="bg-green-500/20 rounded-lg px-3 py-1">
                    <span className="text-green-400 text-sm font-medium">94%</span>
                    <div className="text-xs text-gray-400">Taxa de Resposta</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg px-3 py-1">
                    <span className="text-blue-400 text-sm font-medium">1.8s</span>
                    <div className="text-xs text-gray-400">Tempo Médio</div>
                  </div>
                </div>
              </div>
              
              {/* Dashboard Image Placeholder */}
              <div className="bg-gray-700 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Painel de Controle</p>
                  <div className="mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">
                    Dados em Tempo Real
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 inline-block">
            <h3 className="text-2xl font-bold text-white mb-4">
              Lidere com dados, motive com clareza.
            </h3>
            <p className="text-blue-100">
              Sua gestão educacional mais estratégica e eficiente.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}