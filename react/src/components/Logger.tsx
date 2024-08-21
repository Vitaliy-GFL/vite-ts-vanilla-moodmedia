import { memo, useCallback, useEffect, useState } from 'react';

const Logger = memo(({ clear }: { clear: number }) => {
  const [binded, setBinded] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const formatLog = useCallback((log: unknown, prefix: string): string => {
    return `${prefix}:\n${JSON.stringify(log, null, ' ')}`;
  }, []);

  useEffect(() => {
    if (binded) return;

    setBinded(true);

    const { log: oLog, error: oError } = console;

    console.log = (...params: unknown[]) => {
      setLogs((list) => [...list, ...params.map((log) => formatLog(log, 'LOG'))]);
      oLog(...params);
    };

    console.error = (...params: unknown[]) => {
      setLogs((list) => [...list, ...params.map((log) => formatLog(log, 'ERROR'))]);
      oError(...params);
    };
  }, [binded, formatLog]);

  useEffect(() => {
    setLogs([]);
  }, [clear]);

  return (
    <div className="logs-list">
      {logs.map((log, i) => {
        return <pre key={`${i}:${log}`}>{log}</pre>;
      })}
    </div>
  );
});

export default Logger;
