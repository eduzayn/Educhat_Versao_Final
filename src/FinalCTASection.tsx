import { Button } from "@/components/ui/button"
import { CheckCircle, Crown } from "lucide-react"

export function FinalCTASection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-purple-700 py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 mb-6">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Hora da Decisão</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Sua Instituição Merece{" "}
              <span className="text-yellow-300">Crescer com Inteligência</span>
            </h2>
          </div>

          {/* Benefits List */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Atrair mais alunos com menos esforço</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Organizar sua equipe e simplificar processos</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Controlar totalmente a produtividade e o resultado</span>
            </div>
          </div>

          {/* Main CTA */}
          <div className="mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Então o EduChat é o sistema certo para você.
            </h3>
            
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
            >
              Quero Testar Agora
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-blue-100 text-sm">
            Junte-se a centenas de instituições que já transformaram sua comunicação
          </p>
        </div>
      </div>
    </section>
  )
}