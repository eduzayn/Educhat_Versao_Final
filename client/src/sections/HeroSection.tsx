import { Button } from "../components/ui/button"

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-blue-600 text-sm font-medium">⚡ Plataforma Inteligente para Educação</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-blue-600">EduChat:</span>{" "}
              <span className="text-gray-900">O jeito moderno de </span>
              <span className="text-blue-600">atender leads e alunos.</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
              WhatsApp, Instagram, Messenger e muito mais, em um único lugar. Com IA 
              treinada para atendimento educacional e BI para gestão de equipes e 
              produtividade em home office.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Solicitar Demonstração →
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold"
              >
                ⭐ Quero Testar Grátis
              </Button>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>• Sem fidelidade</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>• Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>• Setup em 48h</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Dashboard */}
          <div className="relative">
            {/* Conversion Badge */}
            <div className="absolute -top-4 left-4 bg-white border border-green-200 rounded-lg px-3 py-2 shadow-lg z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 text-sm font-semibold">+127% Conversão</span>
              </div>
            </div>
            
            {/* Main Dashboard Preview */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* Simulated Dashboard Interface */}
                  <div className="absolute inset-4 bg-white/20 rounded-lg backdrop-blur-sm"></div>
                  <div className="text-center z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">💬</span>
                    </div>
                    <p className="text-gray-700 font-medium">Dashboard Inteligente</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Badges */}
            <div className="flex gap-3 mt-4">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-blue-600 text-sm font-medium">Tempo Real</span>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-3 py-2 shadow-sm">
                <span className="text-sm font-medium">IA + BI Integrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}