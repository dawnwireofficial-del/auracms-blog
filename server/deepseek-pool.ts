import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type ModelMessage, type ToolSet } from 'ai';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const COOLDOWN_MS = 60000;
const MAX_CONSECUTIVE_FAILURES = 3;

interface PoolEntry {
  key: string;
  cooldownUntil: number;
  consecutiveFailures: number;
}

let pool: PoolEntry[] = [];
let nextIndex = 0;

function getKeys(): string[] {
  const raw = process.env.DEEPSEEK_API_KEYS || process.env.DEEPSEEK_API_KEY || '';
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

function refreshPool() {
  const keys = getKeys();
  const existing = new Map(pool.map(e => [e.key, e]));
  pool = keys.map(key => existing.get(key) || {
    key,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  });
  if (nextIndex >= pool.length) nextIndex = 0;
}

export function isDeepSeekConfigured(): boolean {
  return getKeys().length > 0;
}

function markSuccess(key: string) {
  const entry = pool.find(e => e.key === key);
  if (entry) entry.consecutiveFailures = 0;
}

function markFailure(key: string) {
  const entry = pool.find(e => e.key === key);
  if (!entry) return;
  entry.consecutiveFailures++;
  if (entry.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    entry.cooldownUntil = Date.now() + COOLDOWN_MS;
    entry.consecutiveFailures = 0;
  }
}

function nextKey(): string | null {
  refreshPool();
  if (pool.length === 0) return null;

  const now = Date.now();
  for (let i = 0; i < pool.length; i++) {
    const idx = (nextIndex + i) % pool.length;
    const entry = pool[idx];
    if (entry.cooldownUntil <= now) {
      nextIndex = (idx + 1) % pool.length;
      return entry.key;
    }
  }

  const entry = pool[nextIndex];
  nextIndex = (nextIndex + 1) % pool.length;
  return entry.key;
}

function isRetryable(err: any): boolean {
  const status = err?.status ?? err?.statusCode ?? err?.error?.status;
  if (typeof status === 'number' && RETRYABLE_STATUS.has(status)) return true;
  const msg = String(err?.message || err?.name || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('overloaded') ||
    msg.includes('server error') ||
    msg.includes('try again')
  );
}

function createClient(apiKey: string) {
  return createOpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
}

export async function deepseekText(
  params: {
    prompt: string;
    system?: string;
    maxOutputTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string> {
  const timeoutMs = params.timeoutMs || 30000;
  const lastErrors: Error[] = [];
  const attempted = new Set<string>();

  for (let attempt = 0; attempt < pool.length + 1; attempt++) {
    const key = nextKey();
    if (!key || attempted.has(key)) break;
    attempted.add(key);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await generateText({
        model: createClient(key)(DEEPSEEK_MODEL),
        prompt: params.prompt,
        system: params.system,
        maxOutputTokens: params.maxOutputTokens,
        temperature: params.temperature,
        abortSignal: controller.signal,
      });
      clearTimeout(timeoutId);
      markSuccess(key);
      return result.text?.trim() || '';
    } catch (err: any) {
      clearTimeout(timeoutId);
      markFailure(key);
      lastErrors.push(err);
      if (!isRetryable(err)) throw err;
    }
  }

  throw new Error(`DeepSeek request failed with all keys. Last error: ${lastErrors[lastErrors.length - 1]?.message || 'unknown'}`);
}

export async function deepseekChat<TOOLS extends ToolSet>(
  params: {
    messages: ModelMessage[];
    system?: string;
    tools?: TOOLS;
    maxOutputTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<Awaited<ReturnType<typeof generateText<TOOLS>>>> {
  const timeoutMs = params.timeoutMs || 30000;
  const lastErrors: Error[] = [];
  const attempted = new Set<string>();

  for (let attempt = 0; attempt < pool.length + 1; attempt++) {
    const key = nextKey();
    if (!key || attempted.has(key)) break;
    attempted.add(key);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await generateText({
        model: createClient(key)(DEEPSEEK_MODEL),
        messages: params.messages,
        ...(params.system ? { system: params.system } : {}),
        ...(params.tools ? { tools: params.tools } : {}),
        ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        abortSignal: controller.signal,
      });
      clearTimeout(timeoutId);
      markSuccess(key);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      markFailure(key);
      lastErrors.push(err);
      if (!isRetryable(err)) throw err;
    }
  }

  throw new Error(`DeepSeek request failed with all keys. Last error: ${lastErrors[lastErrors.length - 1]?.message || 'unknown'}`);
}
