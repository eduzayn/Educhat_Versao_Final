import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import cors from "cors";

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Diretório de uploads criado: ${uploadsDir}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração de CORS adequada para produção
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://educhat.com.br', 
      'https://www.educhat.com.br',
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
    const { getCourseCategories } = await import('./lib/courseUtils');
    const categories = getCourseCategories();
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias de cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const { COURSE_DICTIONARY } = await import('./lib/courseUtils');
    const courses = Object.values(COURSE_DICTIONARY).map(course => course.courseName).sort();
    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/courses/by-category/:category', async (req: Request, res: Response) => {
  try {
    const { getCoursesByCategory } = await import('./lib/courseUtils');
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

  // Error handling middleware deve vir ANTES do Vite
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // Middleware para garantir que rotas API não sejam interceptadas pelo Vite
  app.use('/api/*', (req, res, next) => {
    if (req.path === '/api/auth/health') {
      console.log(`🔍 Health check interceptado: ${req.method} ${req.path}`);
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

  // Use PORT environment variable for production (Railway) or default to 5000 for development
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
