import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { pool } from "./db";

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Diretório de uploads criado: ${uploadsDir}`);
}

const app = express();

// Configurações de timeout otimizadas para resposta rápida
app.use((req, res, next) => {
  // Timeout reduzido para resposta mais rápida (5 segundos)
  const timeout = process.env.NODE_ENV === 'production' ? 8000 : 10000;
  
  req.setTimeout(timeout, () => {
    console.warn(`⚠️ Request timeout: ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  
  res.setTimeout(timeout, () => {
    console.warn(`⚠️ Response timeout: ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Response timeout' });
    }
  });
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configuração de CORS adequada para produção
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://educhat.com.br', 
      'https://www.educhat.com.br',
      'https://educhat.galaxiasistemas.com.br',
      ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
      ...(process.env.RAILWAY_STATIC_URL ? [process.env.RAILWAY_STATIC_URL] : []),
      ...(process.env.REPLIT_DOMAINS ? 
          process.env.REPLIT_DOMAINS.split(',').map(domain => `https://${domain.trim()}`) : [])
    ] 
  : true;

console.log("🌐 CORS configurado para:", { allowedOrigins, env: process.env.NODE_ENV });

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));



// Endpoints para cursos e categorias
app.get('/api/courses/categories', async (req: Request, res: Response) => {
  try {
    const { getCourseCategories } = await import('./storage/utils/courseUtils');
    const categories = getCourseCategories();
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias de cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const { COURSE_DICTIONARY } = await import('./storage/utils/courseUtils');
    const courses = Object.values(COURSE_DICTIONARY).map(course => course.courseName).sort();
    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/courses/by-category/:category', async (req: Request, res: Response) => {
  try {
    const { getCoursesByCategory } = await import('./storage/utils/courseUtils');
    const category = decodeURIComponent(req.params.category);
    const courses = getCoursesByCategory(category);
    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos por categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint simples para roles antes das middlewares de autenticação
app.get('/api/roles', async (req: Request, res: Response) => {
  try {
    const staticRoles = [
      { id: 1, name: 'Administrador', displayName: 'Administrador', isActive: true },
      { id: 2, name: 'Gerente', displayName: 'Gerente', isActive: true },
      { id: 3, name: 'Atendente', displayName: 'Atendente', isActive: true },
      { id: 4, name: 'Visualizador', displayName: 'Visualizador', isActive: true }
    ];
    res.json(staticRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// Health check endpoint específico para Render (antes das outras rotas)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint is handled in routes.ts

// Servir arquivos estáticos de upload
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Alerta para requests lentos que podem causar 502 (ajustado para produção)
      const slowThreshold = process.env.NODE_ENV === 'production' ? 10000 : 20000;
      if (duration > slowThreshold) {
        console.warn(`🐌 Request muito lento detectado: ${logLine}`);
      }
      
      // Alerta para status codes problemáticos
      if (res.statusCode >= 500) {
        console.error(`🚨 Server error: ${logLine}`);
      }
      
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware robusto para prevenir 502
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`❌ Error ${status} on ${req.method} ${req.path}:`, err);
    
    // Prevenir headers duplos que causam 502
    if (res.headersSent) {
      console.warn(`⚠️ Headers já enviados para ${req.path}, ignorando erro`);
      return;
    }

    // Garantir resposta JSON válida
    try {
      res.status(status).json({ 
        error: message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    } catch (sendError) {
      console.error(`❌ Erro ao enviar resposta de erro para ${req.path}:`, sendError);
      // Última tentativa com resposta simples
      try {
        res.status(500).end('Internal Server Error');
      } catch (finalError) {
        console.error(`❌ Erro crítico na resposta final:`, finalError);
      }
    }
  });

  // Middleware para capturar requests sem resposta (previne 502)
  app.use('*', (req, res, next) => {
    // Timeout de segurança consistente com configuração anterior
    const safetyTimeout = process.env.NODE_ENV === 'production' ? 12000 : 18000;
    
    const timeoutHandler = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⚠️ Request sem resposta detectado: ${req.method} ${req.path}`);
        res.status(404).json({ 
          error: 'Route not found',
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });
      }
    }, safetyTimeout);

    // Limpar timeout quando response for enviado
    res.on('finish', () => {
      clearTimeout(timeoutHandler);
    });

    res.on('close', () => {
      clearTimeout(timeoutHandler);
    });

    next();
  });

  // Middleware para garantir que rotas API não sejam interceptadas pelo Vite
  app.use('/api/*', (req, res, next) => {
    if (req.path === '/api/auth/health') {
      console.log(`🔍 Health check interceptado: ${req.method} ${req.path}`);
    }
    // Garantir que responses da API sejam JSON
    if (req.path.startsWith('/api/ia/') || req.path.startsWith('/api/contacts/')) {
      res.setHeader('Content-Type', 'application/json');
    }
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for production (Railway/Render) or default to 5000 for development
  const port = parseInt(process.env.PORT || "5000", 10);
  
  // Configurações otimizadas para Render
  const serverOptions = {
    port,
    host: "0.0.0.0",
    ...(process.env.NODE_ENV === 'production' && {
      keepAliveTimeout: 65000, // Maior que o timeout do load balancer (60s)
      headersTimeout: 66000, // Deve ser maior que keepAliveTimeout
    })
  };

  server.listen(serverOptions, () => {
    log(`🚀 EduChat server running on port ${port} (${process.env.NODE_ENV || 'development'})`);
    
    // Log de configurações importantes em produção
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Configurações de produção ativas:');
      console.log(`   - Keep-alive timeout: ${serverOptions.keepAliveTimeout}ms`);
      console.log(`   - Headers timeout: ${serverOptions.headersTimeout}ms`);
      console.log(`   - Request timeout: 15s`);
    }
  });
})();
