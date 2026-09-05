import { describe, it, expect, beforeEach } from 'vitest';

import { clearLogs, getLogs, recordArgs, recordLog, serializeArg } from './logBuffer';

describe('logBuffer', () => {
  beforeEach(() => clearLogs());

  it('records and returns entries newest last', () => {
    recordLog('error', 'first');
    recordLog('warn', 'second');
    const logs = getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe('first');
    expect(logs[1].level).toBe('warn');
  });

  it('caps the buffer at 100 entries', () => {
    for (let i = 0; i < 150; i += 1) {
      recordLog('log', `entry ${i}`);
    }
    const logs = getLogs();
    expect(logs).toHaveLength(100);
    expect(logs[0].message).toBe('entry 50');
    expect(logs[99].message).toBe('entry 149');
  });

  it('serializes strings, errors, and objects', () => {
    expect(serializeArg('hi')).toBe('hi');
    expect(serializeArg(new Error('nope'))).toBe('Error: nope');
    expect(serializeArg({ a: 1 })).toBe('{"a":1}');
  });

  it('serializes values that cannot be JSON stringified', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(serializeArg(circular)).toBe('[object Object]');
  });

  it('joins multiple args when recording', () => {
    recordArgs('error', ['failed:', { code: 500 }]);
    expect(getLogs()[0].message).toBe('failed: {"code":500}');
  });

  it('truncates very long messages', () => {
    recordLog('log', 'x'.repeat(5000));
    const { message } = getLogs()[0];
    expect(message.length).toBeLessThanOrEqual(2001);
    expect(message.endsWith('…')).toBe(true);
  });
});
