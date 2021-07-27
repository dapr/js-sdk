import os from 'os';

// RFC5424 https://tools.ietf.org/html/rfc5424
export enum LoggerLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  TRACE = 4,
  VERBOSE = 5,
  DEBUG = 6,
  SILLY = 7,
}

const LoggerLevelKeys = ['ERROR', 'WARN', 'INFO', 'HTTP', 'VERBOSE', 'DEBUG', 'SILLY', 'TRACE'];

const CURRENT_LOGGER_LEVEL = process.env.LOGGER_LEVEL || LoggerLevel.VERBOSE;

console.log(`CURRENT LOG LEVEL: ${CURRENT_LOGGER_LEVEL}`)

interface ILoggerMemory {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export class Logger {
  static print(level: LoggerLevel, message: string, category = 'Server') {
    if (level > CURRENT_LOGGER_LEVEL) {
      return;
    }
    
    const date = new Date();
    const dateISO = date.toISOString(); // ISO 8601
    console.log(`[${dateISO}][${LoggerLevelKeys[level]}][${category}] ${message}`);
  }

  static error(message: string, category = 'Server') {
    this.print(LoggerLevel.ERROR, message, category);
  }

  static warn(message: string, category = 'Server') {
    this.print(LoggerLevel.WARN, message, category);
  }

  static info(message: string, category = 'Server') {
    this.print(LoggerLevel.INFO, message, category);
  }

  static http(message: string, category = 'Server') {
    this.print(LoggerLevel.HTTP, message, category);
  }

  static log(message: string, category = 'Server') {
    this.print(LoggerLevel.VERBOSE, message, category);
  }

  static debug(message: string, category = 'Server') {
    this.print(LoggerLevel.DEBUG, message, category);
  }

  static os(category = 'Memory', msgPrefix = "") {
    const osMemTotal = Math.round((os.totalmem() / 1024 / 1024) * 100) / 100;
    const osMemFree = Math.round((os.freemem() / 1024 / 1024) * 100) / 100;

    this.print(LoggerLevel.TRACE, `${msgPrefix}Memory Free: ${osMemFree} / ${osMemTotal} Mb`, category);
    this.print(LoggerLevel.TRACE, `${msgPrefix}CPU: ${os.cpus().length} Cores`, category);
  }

  static traceStart() {
    return process.hrtime();
  }
}
