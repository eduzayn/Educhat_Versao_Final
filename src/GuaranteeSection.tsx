import { Shield, CheckCircle, Zap, Users, TrendingUp } from "lucide-react"

export function GuaranteeSection() {
  return (
    <section className="bg-green-50 py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-green-600 text-sm font-medium">Garantia e Segurança</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tranquilidade para Testar.{" "}
            <span className="text-green-600">Suporte que Resolve.</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            A solução é simples, rápida e feita para garantir seus primeiros resultados com 
            segurança.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Sem fidelidade
            </h3>
            <p className="text-gray-600">
              Cancele quando quiser, sem 
              burocracia.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Ativação rápida
            </h3>
            <p className="text-gray-600">
              Conecte a sua IA em minutos, 
              sem complicação.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Uso intuitivo
            </h3>
            <p className="text-gray-600">
              Interface simples para acelerar 
              sua rotina.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Processos ágil
            </h3>
            <p className="text-gray-600">
              Tudo pensado para acelerar 
              suas matrículas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}