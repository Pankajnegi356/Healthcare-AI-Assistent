import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { networkInterfaces } from "os";

const app = express();

// Function to get local IP address
function getLocalIP(): string {
  const interfaces = networkInterfaces();
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    if (interfaceInfo) {
      for (const info of interfaceInfo) {
        if (info.family === 'IPv4' && !info.internal) {
          return info.address;
        }
      }
    }
  }
  return 'localhost';
}

// Enhanced CORS middleware for remote access and tunneling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // Enhanced origin handling for production and tunneling services
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.PUBLIC_URL || '',
        // Add common tunneling domains
        'https://localhost',
        'https://127.0.0.1',
        ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
      ].filter(Boolean)
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://0.0.0.0:3000',
        'https://localhost:3000',
        'https://127.0.0.1:3000'
      ];
  
  // Allow tunneling services (ngrok, serveo, localtunnel, etc.)
  const isTunnelingService = host && (
    host.includes('ngrok.') || 
    host.includes('serveo.net') || 
    host.includes('localtunnel.me') ||
    host.includes('cloudflare.com') ||
    host.includes('tunnelmole.com') ||
    host.includes('loclx.io') ||
    host.includes('.app') ||
    host.includes('.dev')
  );
  
  if (origin && (allowedOrigins.includes(origin) || isTunnelingService)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development' || isTunnelingService) {
    // In development or when using tunneling, allow any origin
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Security and performance middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Trust proxy for deployed environments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Request logging and performance monitoring
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
      
      // Log response data only in development
      if (process.env.NODE_ENV === 'development' && capturedJsonResponse) {
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
  try {
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log error details
      log(`ERROR: ${req.method} ${req.path} - ${status} - ${message}`);
      
      if (process.env.NODE_ENV === 'development') {
        log(`Stack trace: ${err.stack}`);
      }

      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Setup Vite in development, static files in production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Server configuration with enhanced settings
    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";
    
    server.listen(port, host, () => {
      log(`🚀 Healthcare AI server running on ${host}:${port}`);
      log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`📍 Health check: http://${host}:${port}/api/health`);
      
      if (process.env.NODE_ENV === 'development') {
        log(`📍 Local access: http://localhost:${port}`);
        log(`📍 Network access: http://${getLocalIP()}:${port}`);
        log(`📍 For port forwarding, use: http://0.0.0.0:${port}`);
        log(`📍 Manager can access via your forwarded URL on port ${port}`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      log(`Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        log('Server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();
