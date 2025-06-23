export function getOptimalAuthConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  const railwayUrl = process.env.RAILWAY_STATIC_URL;
  const replitDomains = process.env.REPLIT_DOMAINS;
  const replitDeploymentId = process.env.REPLIT_DEPLOYMENT_ID;
  const replId = process.env.REPL_ID;
  
  // Detectar plataforma de hospedagem
  const isRender = !!renderUrl;
  const isRailway = !!railwayUrl;
  const isReplit = !!(replitDomains || replitDeploymentId || replId);
  
  // Configurações otimizadas por plataforma com correções para produção
  let cookieSecure = false;
  let sameSite: 'strict' | 'lax' | 'none' = 'lax';
  let trustProxy = false;
  
  if (isProduction) {
    if (isRender || isRailway) {
      cookieSecure = true;
      sameSite = 'lax';
      trustProxy = true;
    } else if (isReplit) {
      // CORREÇÃO CRÍTICA: Replit em produção precisa de configurações específicas
      cookieSecure = false; // Replit deployment não funciona com cookies seguros
      sameSite = 'lax';
      trustProxy = false; // Não usar proxy trust no Replit
    }
  } else {
    // Desenvolvimento - configurações permissivas
    cookieSecure = false;
    sameSite = 'lax';
    trustProxy = false;
  }
  
  return {
    isProduction,
    cookieSecure,
    sameSite,
    trustProxy, // Usar valor calculado acima
    sessionSecret: process.env.SESSION_SECRET || "educhat-fallback-secret-2024",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias para melhor estabilidade
    platform: isRender ? 'render' : isRailway ? 'railway' : isReplit ? 'replit' : 'unknown'
  };
} 