import { memo, useCallback, useEffect, useRef, useState } from 'react';

import ConsoleInterceptor, { LogEntry } from '@/services/ConsoleInterceptor';

const Logger = memo(({ clear }: { clear: number }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const formatValue = useCallback((value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    
    if (type === 'string') return `"${value}"`;
    if (type === 'number' || type === 'boolean') return String(value);
    if (type === 'function') return `[Function: ${(value as Function).name || 'anonymous'}]`;
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[\n${value.map((item, i) => `  ${i}: ${formatValue(item)}`).join(',\n')}\n]`;
    }
    if (type === 'object') {
      try {
        const keys = Object.keys(value as object);
        if (keys.length === 0) return '{}';
        return `{\n${keys.map((key) => `  ${key}: ${formatValue((value as Record<string, unknown>)[key])}`).join(',\n')}\n}`;
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  }, []);

  const scrollToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  useEffect(() => {
    ConsoleInterceptor.intercept();

    // Load existing logs
    setLogs(ConsoleInterceptor.getLogs());

    const unsubscribe = ConsoleInterceptor.subscribe((log) => {
      setLogs((list) => [...list, log]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setLogs([]);
    ConsoleInterceptor.clear();
  }, [clear]);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', { hour12: false });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  }, []);

  return (
    <div className="logs-list">
      {logs.length === 0 ? (
        <div className="logs-empty">No logs yet...</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className={`log-entry log-entry--${log.level}`}>
            <div className="log-header">
              <span className="log-level">{log.level.toUpperCase()}</span>
              <span className="log-time">{formatTime(log.timestamp)}</span>
            </div>
            <div className="log-content">
              {log.args.map((arg, i) => (
                <pre key={i} className="log-value">
                  {formatValue(arg)}
                </pre>
              ))}
            </div>
          </div>
        ))
      )}
      <div ref={logsEndRef} />
    </div>
  );
});

export default Logger;
