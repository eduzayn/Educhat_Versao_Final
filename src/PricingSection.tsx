import { Button } from "@/components/ui/button"
import { CheckCircle, Star } from "lucide-react"

export function PricingSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 text-sm font-medium">Planos e Investimento</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planos sob Medida para{" "}
            <span className="text-blue-600">Sua Realidade</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Escolha o plano ideal para o tamanho e necessidades da sua instituição.
          </p>

          {/* Toggle */}
          <div className="inline-flex bg-white rounded-full p-1 border border-gray-200">
            <button className="px-6 py-2 text-gray-600 text-sm">Mensal</button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm">Anual</button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Essencial Plan */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Essencial</h3>
              <p className="text-gray-600 text-sm mb-6">Para escolas pequenas e cursos livres</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">Comece</div>
                <div className="text-3xl font-bold text-gray-900">Grátis</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Até 1 atendente</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">WhatsApp + Instagram</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">IA básica</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Relatórios mensais</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Suporte por e-mail</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full">
              Começar Agora
            </Button>
          </div>

          {/* Profissional Plan - Featured */}
          <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 shadow-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Mais Popular
              </div>
            </div>
            
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Profissional</h3>
              <p className="text-gray-600 text-sm mb-6">Para instituições com equipe de atendimento</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  R$ 516<span className="text-lg font-normal text-gray-600">/mês</span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Até 3 atendentes</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">WhatsApp + Facebook</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">IA avançada + treinamento</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Campanhas + relatórios</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">CRM educacional</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Suporte</span>
              </li>
            </ul>

            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Começar Agora
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 text-sm mb-6">Para grandes educadoras com alta demanda</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  R$ 1228<span className="text-lg font-normal text-gray-600">/mês</span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Até 10 atendentes</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Até 2 canais WhatsApp no</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Redes Sociais Facebook e</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">IA avançada + treinamento</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">BI completo + relatórios</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">CRM educacional</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Suporte Prioritário</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full">
              Começar Agora
            </Button>
          </div>

          {/* Personalizado Plan */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-gray-600 rounded"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personalizado</h3>
              <p className="text-gray-600 text-sm mb-6">Solução customizada para suas necessidades específicas</p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">Consultar</div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Atendentes ilimitados</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Todos os canais disponíveis</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">IA personalizada</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Relatórios customizados</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Integrações específicas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Suporte dedicado</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Consultoria especializada</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full">
              Falar com Suporte
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">
            Quer uma solução sob medida?
          </h3>
          <p className="text-blue-100 mb-6">
            Nossos especialistas estão prontos para ajudar sua instituição a 
            escolher com eficiência.
          </p>
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-50">
            Fale agora com um consultor no WhatsApp
          </Button>
        </div>
      </div>
    </section>
  )
}