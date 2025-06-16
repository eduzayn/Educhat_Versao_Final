export function getOptimalAuthConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  const railwayUrl = process.env.RAILWAY_STATIC_URL;
  const replitDomains = process.env.REPLIT_DOMAINS;
  
  // Detectar plataforma de hospedagem
  const isRender = !!renderUrl;
  const isRailway = !!railwayUrl;
  const isReplit = !!replitDomains;
  
  // Configurações otimizadas por plataforma
  let cookieSecure = false;
  let sameSite: 'strict' | 'lax' | 'none' = 'lax';
  
  if (isProduction) {
    if (isRender || isRailway) {
      cookieSecure = true;
      sameSite = 'lax';
    } else if (isReplit) {
      cookieSecure = false; // Replit tem problemas com cookies seguros
      sameSite = 'lax';
    }
  }
  
  return {
    isProduction,
    cookieSecure,
    sameSite,
    trustProxy: isProduction,
    sessionSecret: process.env.SESSION_SECRET || "educhat-fallback-secret-2024",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias para melhor estabilidade
    platform: isRender ? 'render' : isRailway ? 'railway' : isReplit ? 'replit' : 'unknown'
  };
} 