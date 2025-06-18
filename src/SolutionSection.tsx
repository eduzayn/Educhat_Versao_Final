import { CheckCircle, Zap, Monitor, Briefcase, BarChart3, Headphones, Users, Bot } from "lucide-react"

export function SolutionSection() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 text-sm font-medium">A Solução Definitiva</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sistema inteligente de atendimento e comunicação com I.A.,{" "}
            <span className="text-blue-600">feito para o setor educacional</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            O EduChat foi pensado exclusivamente para escolas, faculdades e 
            infoprodutores que desejam crescer com organização, eficiência e tecnologia.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Interface moderna, intuitiva e acessível
                  </h3>
                  <p className="text-gray-600">
                    Design focado na facilidade de uso para acelerar sua rotina.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Monitor de Inatividade
                  </h3>
                  <p className="text-gray-600">
                    Monitora atividade e envia alertas de inatividade.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    CRM educacional com funis personalizados
                  </h3>
                  <p className="text-gray-600">
                    Gestão completa e personalizada do ciclo de vida do aluno.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Portal de BI para análise de desempenho
                  </h3>
                  <p className="text-gray-600">
                    Relatórios detalhados para acompanhar resultados da equipe.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Suporte nativo ao trabalho remoto
                  </h3>
                  <p className="text-gray-600">
                    Controla e gestão eficientes para equipes distribuídas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Feature 6 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Prof. Ana copilot
                  </h3>
                  <p className="text-gray-600">
                    IA educacional que resolve dúvidas e otimiza atendimentos.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 7 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chat de equipe interno
                  </h3>
                  <p className="text-gray-600">
                    Comunicação rápida e econômica para sua equipe.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 8 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cálculo automático de comissionamento
                  </h3>
                  <p className="text-gray-600">
                    Calcula automaticamente comissões dos vendedores.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 9 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Criação e disparo de campanhas em massa
                  </h3>
                  <p className="text-gray-600">
                    Envio programado de campanhas para seus leads.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 10 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Atendente SON IA
                  </h3>
                  <p className="text-gray-600">
                    Atendimento inteligente e triagem automática de leads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}