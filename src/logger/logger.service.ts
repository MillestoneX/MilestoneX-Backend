import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pino from 'pino';
import { createWriteStream, WriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService implements OnModuleDestroy {
  private logger: pino.Logger;
  private stream: WriteStream;
  private currentDate: string;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const level = process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug');
    this.currentDate = this.getDateStr();

    const logsDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

    const filePath = join(logsDir, `app-${this.currentDate}.log`);
    this.stream = createWriteStream(filePath, { flags: 'a' });

    const options: pino.LoggerOptions = {
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    // In production we emit JSON to the file; in development we still write JSON to file
    // and rely on external tooling (or stdout) for pretty output.
    this.logger = pino(options, this.stream as any);
  }

  private getDateStr(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  private rotateIfNeeded() {
    const today = this.getDateStr();
    if (today !== this.currentDate) {
      this.currentDate = today;
      try {
        this.stream.end();
      } catch (e) {
        // ignore
      }
      const logsDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
      const filePath = join(logsDir, `app-${this.currentDate}.log`);
      this.stream = createWriteStream(filePath, { flags: 'a' });
      const opts = { level: this.logger.level } as pino.LoggerOptions;
      this.logger = pino(opts, this.stream as any);
    }
  }

  log(message: string, meta?: Record<string, any>) {
    this.rotateIfNeeded();
    this.logger.info({ ...meta }, message);
  }

  error(message: string, trace?: string, meta?: Record<string, any>) {
    this.rotateIfNeeded();
    if (trace) this.logger.error({ trace, ...meta }, message);
    else this.logger.error({ ...meta }, message);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.rotateIfNeeded();
    this.logger.warn({ ...meta }, message);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.rotateIfNeeded();
    this.logger.debug({ ...meta }, message);
  }

  onModuleDestroy() {
    try {
      this.stream.end();
    } catch (e) {
      // ignore
    }
  }
}
