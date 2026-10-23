import { describe, expect, it, vi } from 'vitest';

// όπως ο Proxy του Capacitor: κάθε όνομα (και το `then`) είναι μέθοδος του plugin που πάει στη Java
const calls: string[] = [];
vi.mock('@capacitor/core', () => ({
  registerPlugin: () =>
    new Proxy({}, {
      get: (_, prop) => {
        if (prop === '$$typeof') return undefined;
        return (o?: { text?: string }) => {
          calls.push(String(prop));
          // το `then` δεν υπάρχει στη Java: δεν απαντά ποτέ
          if (prop === 'then') return new Promise(() => {});
          return Promise.resolve(prop === 'speak' ? { spoken: true, why: '', engine: `tts:${o?.text}` } : undefined);
        };
      },
    }),
}));
(globalThis as { window?: unknown }).window ??= globalThis;

describe('φωνή στο Android', () => {
  it('η androidSay φτάνει στη speak του plugin και απαντά', async () => {
    const { androidSay, androidVoiceInfo } = await import('../src/android');
    const said = await Promise.race([androidSay('μήλο', 'el-GR', 0.8), new Promise((r) => setTimeout(() => r('κόλλησε'), 500))]);
    expect(said).toBe(true);
    expect(calls).toContain('speak');
    expect(calls).not.toContain('then');
    expect(androidVoiceInfo()).toContain('tts:μήλο');
  });
});
