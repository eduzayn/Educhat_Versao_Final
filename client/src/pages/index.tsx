export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            EduChat: O jeito moderno de atender leads e alunos
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            WhatsApp, Instagram, Messenger e muito mais, em um único lugar. Com IA treinada para atendimento educacional.
          </p>
          <button className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors">
            Comece sua prova gratuita
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Você está perdendo alunos todos os dias...
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Demora no atendimento</h3>
              <p className="text-gray-600">Leads desistem quando não são atendidos rapidamente</p>
            </div>
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Múltiplas plataformas</h3>
              <p className="text-gray-600">WhatsApp, Instagram, Facebook... tudo separado</p>
            </div>
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Respostas genéricas</h3>
              <p className="text-gray-600">Atendimento sem conhecimento sobre seus cursos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            A solução completa para seu atendimento educacional
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Tudo em um só lugar</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  WhatsApp Business integrado
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Instagram Direct Messages
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Facebook Messenger
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  IA treinada com seus cursos
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 p-8 rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500 mb-2">WhatsApp - Agora</div>
                <div className="text-gray-800">"Olá! Vi que vocês tem curso de marketing digital?"</div>
                <div className="mt-4 bg-blue-500 text-white p-3 rounded-lg">
                  "Sim! Temos o curso completo de Marketing Digital com certificado. Inclui Google Ads, Facebook Ads e muito mais. Gostaria de saber mais detalhes?"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BI Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Dados que transformam seu negócio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Taxa de Conversão</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">67%</div>
              <p className="text-gray-600">Aumento médio na conversão de leads</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Tempo de Resposta</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">&lt; 1min</div>
              <p className="text-gray-600">Resposta automática instantânea</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Satisfação</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <p className="text-gray-600">Dos alunos aprovam o atendimento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Invista no crescimento da sua escola
          </h2>
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-semibold mb-4">Plano Completo</h3>
            <div className="text-5xl font-bold mb-6">
              <span className="line-through text-gray-300">R$ 497</span>
              <span className="block text-yellow-400">R$ 297/mês</span>
            </div>
            <ul className="text-left max-w-md mx-auto space-y-2 mb-8">
              <li className="flex items-center">
                <span className="text-yellow-400 mr-3">✓</span>
                Atendimento multicanal ilimitado
              </li>
              <li className="flex items-center">
                <span className="text-yellow-400 mr-3">✓</span>
                IA treinada com seus cursos
              </li>
              <li className="flex items-center">
                <span className="text-yellow-400 mr-3">✓</span>
                Dashboard completo de métricas
              </li>
              <li className="flex items-center">
                <span className="text-yellow-400 mr-3">✓</span>
                Suporte prioritário
              </li>
            </ul>
            <button className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors">
              Experimente 7 dias grátis
            </button>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🛡️</div>
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Garantia de 30 dias
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Se não aumentarmos suas matrículas em 30 dias, devolvemos 100% do seu dinheiro. Sem perguntas, sem complicações.
          </p>
          <button className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors">
            Começar agora sem risco
          </button>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-700 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para triplicar suas matrículas?
          </h2>
          <p className="text-xl mb-8">
            Mais de 500 escolas já usam o EduChat para crescer mais rápido
          </p>
          <button className="bg-yellow-400 text-black px-12 py-6 rounded-lg font-bold text-xl hover:bg-yellow-300 transition-colors">
            COMEÇAR MINHA PROVA GRATUITA
          </button>
          <p className="text-sm mt-4 opacity-80">
            ✓ 7 dias grátis ✓ Sem cartão de crédito ✓ Cancelamento fácil
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">EduChat</h3>
              <p className="text-gray-400">
                A plataforma completa para atendimento educacional inteligente
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Funcionalidades</li>
                <li>Preços</li>
                <li>Integrações</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre nós</li>
                <li>Blog</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de ajuda</li>
                <li>Documentação</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EduChat. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}