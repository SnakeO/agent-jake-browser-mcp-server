/**
 * Utility tools: wait, screenshot, getConsoleLogs.
 */
import { z } from 'zod';
import { createTool, textResult, imageResult, errorResult } from './types.js';
import type { Tool } from '../types.js';

/**
 * Wait for a specified time.
 */
export const waitTool: Tool = createTool({
  name: 'browser_wait',
  description: 'Wait for a specified number of milliseconds. Use sparingly - prefer waiting for elements.',
  schema: z.object({
    ms: z.number().min(0).max(30000).describe('Milliseconds to wait (max 30 seconds)'),
  }),
  async handle(context, params) {
    const response = await context.send('browser_wait', { time: params.ms / 1000 });

    if (!response.success) {
      return errorResult(response.error?.message ?? 'Wait failed');
    }

    return textResult(`Waited ${params.ms}ms`);
  },
});

/**
 * Take a screenshot of the page.
 */
export const screenshotTool: Tool = createTool({
  name: 'browser_screenshot',
  description: 'Take a screenshot of the current page or a specific element.',
  schema: z.object({
    ref: z.string().optional().describe('Element reference to screenshot'),
    selector: z.string().optional().describe('CSS selector for element to screenshot'),
    fullPage: z.boolean()
      .optional()
      .default(false)
      .describe('Capture the full scrollable page'),
    quality: z.number()
      .min(0)
      .max(100)
      .optional()
      .default(80)
      .describe('JPEG quality (0-100)'),
  }),
  async handle(context, params) {
    const response = await context.send('browser_screenshot', {
      ref: params.ref,
      selector: params.selector,
      fullPage: params.fullPage,
      quality: params.quality,
    });

    if (!response.success) {
      return errorResult(response.error?.message ?? 'Screenshot failed');
    }

    // Extension may return {image: "data:image/png;base64,..."} or just the base64 string
    const result = response.result as { image?: string } | string;
    let base64 = typeof result === 'string' ? result : result.image;

    if (!base64) {
      return errorResult('No screenshot data received');
    }

    // Remove data URL prefix if present
    if (base64.startsWith('data:image/')) {
      base64 = base64.replace(/^data:image\/[^;]+;base64,/, '');
    }

    return imageResult(base64, 'image/png');
  },
});

/**
 * Get console logs from the page.
 */
export const getConsoleLogsTool: Tool = createTool({
  name: 'browser_get_console_logs',
  description: 'Get console log messages from the page (log, warn, error, info).',
  schema: z.object({
    types: z.array(z.enum(['log', 'warn', 'error', 'info', 'debug']))
      .optional()
      .describe('Filter by log types'),
    clear: z.boolean()
      .optional()
      .default(false)
      .describe('Clear logs after retrieving'),
  }),
  async handle(context, params) {
    const response = await context.send('browser_get_console_logs', {
      types: params.types,
      clear: params.clear,
    });

    if (!response.success) {
      return errorResult(response.error?.message ?? 'Get console logs failed');
    }

    const logs = response.result as Array<{ type: string; text: string; timestamp: number }>;

    if (logs.length === 0) {
      return textResult('No console logs found');
    }

    const formatted = logs.map(log => {
      const time = new Date(log.timestamp).toISOString();
      return `[${time}] [${log.type.toUpperCase()}] ${log.text}`;
    }).join('\n');

    return textResult(formatted);
  },
});

export const utilityTools: Tool[] = [
  waitTool,
  screenshotTool,
  getConsoleLogsTool,
];
