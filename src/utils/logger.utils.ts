export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
  }
  
  export class Logger {
    private prefix: string;
  
    constructor(prefix: string) {
      this.prefix = prefix;
    }
  
    debug(message: string, data?: any): void {
      this.log(LogLevel.DEBUG, message, data);
    }
  
    info(message: string, data?: any): void {
      this.log(LogLevel.INFO, message, data);
    }
  
    warn(message: string, data?: any): void {
      this.log(LogLevel.WARN, message, data);
    }
  
    error(message: string, error?: any): void {
      this.log(LogLevel.ERROR, message, error);
    }
  
    private log(level: LogLevel, message: string, data?: any): void {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level}] [${this.prefix}] ${message}`;
      
      if (data) {
        console.log(logMessage, data);
      } else {
        console.log(logMessage);
      }
    }
  }
  
  export function createLogger(prefix: string): Logger {
    return new Logger(prefix);
  }