import { Button } from "../components/ui/button"

export function PricingSection() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <span className="text-blue-600 text-sm">💰 Planos e Investimento</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Planos sob Medida para <span className="text-blue-600">Sua Realidade</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Escolha o plano ideal para o tamanho e necessidades da sua instituição.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className="text-gray-600">Mensal</span>
            <div className="relative">
              <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full transform translate-x-5 transition-transform"></div>
              </div>
            </div>
            <span className="text-blue-600 font-semibold">Anual</span>
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Mais Popular</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Essencial Plan */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-600 text-lg">📱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Essencial</h3>
              <p className="text-gray-600 text-sm mb-4">Para escolas pequenas e cursos livres</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">Comece</div>
                <div className="text-3xl font-bold text-gray-900">Grátis</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Até 1 atendente
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                WhatsApp + Instagram
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                IA básica
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Relatórios mensais
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Suporte por e-mail
              </li>
            </ul>

            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              Começar Agora
            </Button>
          </div>

          {/* Professional Plan - Highlighted */}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-lg relative transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Mais Popular</span>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-blue-600 text-lg">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Profissional</h3>
              <p className="text-gray-600 text-sm mb-4">Para instituições com equipe de atendimento</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600">R$ 516</div>
                <div className="text-gray-500 text-sm">/mês</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Até 3 atendentes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Multicanais + Facebook
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                IA avançada + treinamento
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Campanhas + relatórios
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                CRM educacional
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Suporte
              </li>
            </ul>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Começar Agora
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-purple-600 text-lg">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 text-sm mb-4">Para grandes educacionais com alta demanda</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-purple-600">R$ 1228</div>
                <div className="text-gray-500 text-sm">/mês</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Até 10 atendentes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Até 3 canais WhatsApp ou Telegram
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Redes Sociais Facebook e Instagram
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                IA avançada + treinamento
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                BI completo + relatórios
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                CRM educacional
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Suporte Prioritário
              </li>
            </ul>

            <Button variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50">
              Começar Agora
            </Button>
          </div>

          {/* Personalizado Plan */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-600 text-lg">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personalizado</h3>
              <p className="text-gray-600 text-sm mb-4">Soluções customizadas para suas necessidades específicas</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">Consultar</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Atendentes ilimitados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Todos os canais disponíveis
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                IA personalizada
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Relatórios customizados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Integrações específicas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Suporte dedicado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Consultoria especializada
              </li>
            </ul>

            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              Falar com Suporte
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mt-12">
          <h3 className="text-2xl font-bold mb-4">Quer uma solução sob medida?</h3>
          <p className="text-blue-100 mb-6">
            Nossos especialistas estão prontos para ajudar sua instituição a 
            crescer com comunicação e tecnologia.
          </p>
          <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
            📞 Fale agora com um consultor no WhatsApp
          </Button>
        </div>
      </div>
    </section>
  )
}