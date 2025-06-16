import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
// Logo removido durante limpeza - usando texto simples

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/login', loginData);
      const user = await response.json();
      
      // Invalidar cache de autenticação para forçar refresh do estado
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta, ${user.displayName || user.firstName || 'usuário'}!`,
      });
      
      // Pequeno delay para garantir que a invalidação da cache foi processada
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/register', {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
      });
      const user = await response.json();
      
      // Invalidar cache de autenticação para forçar refresh do estado
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Bem-vindo ao EduChat, ${user.displayName || user.firstName || 'usuário'}!`,
      });
      
      // Pequeno delay para garantir que a invalidação da cache foi processada
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-educhat-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Logo do EduChat */}
            <div className="flex justify-center">
              <div className="text-4xl font-bold text-educhat-primary">
                EduChat
              </div>
            </div>

            {/* Título */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-educhat-dark">
                Bem-vindo ao EduChat
              </h1>
              <p className="text-educhat-medium text-sm">
                Plataforma de comunicação omnichannel para instituições educacionais
              </p>
            </div>

            {/* Botões de alternância */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                type="button"
                onClick={() => setIsRegistering(false)}
                className={`flex-1 text-sm py-2 px-4 rounded-md transition-all ${
                  !isRegistering 
                    ? 'bg-white text-educhat-primary shadow-sm' 
                    : 'bg-transparent text-gray-600 hover:text-gray-800'
                }`}
                variant="ghost"
              >
                Entrar
              </Button>
              <Button
                type="button"
                onClick={() => setIsRegistering(true)}
                className={`flex-1 text-sm py-2 px-4 rounded-md transition-all ${
                  isRegistering 
                    ? 'bg-white text-educhat-primary shadow-sm' 
                    : 'bg-transparent text-gray-600 hover:text-gray-800'
                }`}
                variant="ghost"
              >
                Cadastrar
              </Button>
            </div>

            {/* Formulário de Login */}
            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-educhat-primary hover:bg-educhat-secondary text-white py-3 rounded-xl font-medium transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            ) : (
              /* Formulário de Registro */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="João"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      required
                      className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Silva"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      required
                      className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-educhat-primary hover:bg-educhat-secondary text-white py-3 rounded-xl font-medium transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            )}

            {/* Features */}
            <div className="pt-4 border-t border-gray-100">
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