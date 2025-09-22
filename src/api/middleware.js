// src/api/middleware.js

// Request validation middleware
export function validateRequest(schema) {
    return (req, res, next) => {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.flatten()
        });
      }
      
      req.body = result.data;
      next();
    };
  }
  
  // Error handling middleware
  export function errorHandler(err, req, res, next) {
    console.error("[Error]", {
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack
    });
    
    // Handle known error types
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        message: err.message
      });
    }
    
    if (err.name === "NotFoundError") {
      return res.status(404).json({
        error: "Not found",
        message: err.message
      });
    }
    
    // Default error response
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
    });
  }
  
  // Request logging middleware
  export function requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
  }
  
  // CORS middleware configuration
  export function corsConfig() {
    return {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    };
  }
  
  // Cache control middleware
  export function noCache(req, res, next) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    next();
  }
  
  // Rate limiting configuration (optional - requires express-rate-limit)
  export function rateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    };
  }