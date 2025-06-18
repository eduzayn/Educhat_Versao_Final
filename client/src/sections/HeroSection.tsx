import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-600 text-sm font-medium">Plataforma Inteligente para Educação</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-blue-600">EduChat:</span>{" "}
              <span className="text-gray-900">O jeito moderno de</span>{" "}
              <span className="text-blue-600">atender leads e alunos.</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              WhatsApp, Instagram, Messenger e muito mais, em um único lugar. Com IA 
              treinada para atendimento educacional e BI para gestão de equipes e 
              produtividade em home office.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex gap-4 mb-8">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3">
                Quero Testar Grátis
              </Button>
            </div>
            
            {/* Features */}
            <div className="flex gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sem fidelidade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Setup em 48h</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Dashboard Image */}
          <div className="relative">
            {/* Conversion Badge */}
            <div className="absolute -top-4 left-4 bg-white border border-green-200 rounded-lg px-3 py-2 shadow-sm z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-sm font-medium">+127% Conversão</span>
              </div>
            </div>
            
            {/* Main Dashboard Image */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white text-2xl">💬</span>
                    </div>
                    <p className="text-gray-600">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Badges */}
            <div className="flex gap-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-gray-600 text-sm">Tempo Real</span>
              </div>
              <div className="bg-purple-600 text-white rounded-lg px-3 py-2 shadow-sm">
                <span className="text-sm">IA + BI Integrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}