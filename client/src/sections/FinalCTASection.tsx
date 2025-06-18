import { Button } from "../components/ui/button"

export function FinalCTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 py-20 px-6 text-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 mb-6">
            <span className="text-white text-sm">⭐ Hora da Decisão</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Sua Instituição Merece 
            Crescer com <span className="text-yellow-300">Inteligência</span>
          </h2>
        </div>

        {/* Benefits List */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-yellow-300 text-xl">📈</span>
            </div>
            <p className="text-white/90">Atrair mais alunos com menos esforço</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-yellow-300 text-xl">👥</span>
            </div>
            <p className="text-white/90">Organizar sua equipe e simplificar processos</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-yellow-300 text-xl">⚡</span>
            </div>
            <p className="text-white/90">Controlar totalmente a produtividade e a operação</p>
          </div>
        </div>

        {/* Main CTA */}
        <div className="mb-8">
          <p className="text-xl mb-6 text-white/90">
            Então o EduChat é o sistema certo para você.
          </p>
          
          <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg">
            ⭐ Quero Testar Agora
          </Button>
        </div>

        {/* Bottom Note */}
        <p className="text-white/70 text-sm">
          Junte-se às centenas de instituições que já transformaram sua comunicação
        </p>
      </div>
    </section>
  )
}