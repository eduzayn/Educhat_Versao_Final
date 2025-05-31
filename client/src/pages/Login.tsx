import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent } from '@/shared/ui/ui/card';
import logoPath from '@assets/ChatGPT Image 26 de mai. de 2025, 00_39_36.png';

export function Login() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-educhat-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Logo do EduChat */}
            <div className="flex justify-center">
              <img 
                src={logoPath} 
                alt="EduChat Logo" 
                className="w-48 h-auto"
              />
            </div>

            {/* Título e Descrição */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-educhat-dark">
                Bem-vindo ao EduChat
              </h1>
              <p className="text-educhat-medium text-sm leading-relaxed">
                A plataforma de comunicação omnichannel mais moderna para instituições educacionais. 
                Conecte-se com seus alunos através de múltiplos canais em uma única interface.
              </p>
            </div>

            {/* Botão de Login */}
            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                className="w-full bg-educhat-primary hover:bg-educhat-secondary text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Entrar com Replit
              </Button>
              
              <p className="text-xs text-educhat-medium">
                Faça login com sua conta Replit para acessar o dashboard
              </p>
            </div>

            {/* Features */}
            <div className="pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-xs text-educhat-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-educhat-primary rounded-full"></div>
                  <span>WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-educhat-primary rounded-full"></div>
                  <span>Instagram</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-educhat-primary rounded-full"></div>
                  <span>Facebook</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-educhat-primary rounded-full"></div>
                  <span>Email</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}