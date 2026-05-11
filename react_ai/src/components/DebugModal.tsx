import { useCallback, useEffect, useRef, useState } from "react";

import { useConsoleCapture, type LogLevel } from "@/hooks/useConsoleCapture";
import { openDevTools } from "@/services/api/debug";
import { P2PClient } from "@/services/api/p2p";

import "./DebugModal.scss";

const LEVEL_COLORS: Record<LogLevel, string> = {
  log: "#ccc",
  warn: "#ffc107",
  error: "#f44336",
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  log: "LOG",
  warn: "WRN",
  error: "ERR",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

interface Position {
  x: number;
  y: number;
}
interface Size {
  w: number;
  h: number;
}
const { outerHeight, outerWidth } = window;
const initialSize: Size = { w: outerWidth / 3, h: outerHeight / 3 };
const initialPos: Position = { x: outerWidth - initialSize.w - 100, y: outerHeight - initialSize.h - 100 };

export default function DebugModal() {
  const { logs, clear } = useConsoleCapture(true);
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState<LogLevel | "all">("all");

  const [pos, setPos] = useState<Position>(initialPos);
  const [size, setSize] = useState<Size>(initialSize);

  const dragging = useRef(false);
  const resizing = useRef(false);
  const offset = useRef<Position>({ x: 0, y: 0 });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const p2pRef = useRef<P2PClient | null>(null);

  const onP2PTest = useCallback(() => {
    if (!p2pRef.current) {
      const client = new P2PClient("debug-loopback", "debug-self", false);
      client.on("debug-test", (data, from) => {
        console.log("[P2P] recv from", from, data);
      });
      p2pRef.current = client;
    }
    p2pRef.current.emit("debug-test", { ts: Date.now() });
  }, []);

  useEffect(() => {
    if (!collapsed) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, collapsed]);

  const onPointerDown = useCallback(
    (type: "drag" | "resize") => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (type === "drag") {
        dragging.current = true;
        offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      } else {
        resizing.current = true;
        offset.current = { x: e.clientX, y: e.clientY };
      }

      const onMove = (ev: PointerEvent) => {
        if (dragging.current) {
          setPos({
            x: Math.min(outerWidth - 34, Math.max(-size.w + 34, ev.clientX - offset.current.x)),
            y: Math.min(outerHeight - 34, Math.max(0, ev.clientY - offset.current.y)),
          });
        }
        if (resizing.current) {
          const dx = ev.clientX - offset.current.x;
          const dy = ev.clientY - offset.current.y;
          offset.current = { x: ev.clientX, y: ev.clientY };
          setSize((s) => ({ w: Math.max(280, s.w + dx), h: Math.max(120, s.h + dy) }));
        }
      };

      const onUp = () => {
        dragging.current = false;
        resizing.current = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [pos, size.w],
  );

  const filtered = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  const counts = {
    all: logs.length,
    log: logs.filter((l) => l.level === "log").length,
    warn: logs.filter((l) => l.level === "warn").length,
    error: logs.filter((l) => l.level === "error").length,
  };

  return (
    <div
      className="debug-modal"
      style={{
        left: pos.x,
        top: pos.y,
        width: collapsed ? 280 : size.w,
        height: collapsed ? "auto" : size.h,
      }}
    >
      <div className="debug-modal__header" onPointerDown={onPointerDown("drag")}>
        <span className="debug-modal__title">Debug v{__APP_VERSION__}</span>
        <div className="debug-modal__header-actions">
          <button className="debug-modal__btn" onClick={openDevTools} title="DevTools">
            &lt;/&gt;
          </button>
          <button className="debug-modal__btn" onClick={clear} title="Clear">
            &#x2715;
          </button>
          <button
            className="debug-modal__btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "\u25A1" : "\u2014"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="debug-modal__filters">
            {(["all", "log", "warn", "error"] as const).map((lvl) => (
              <button
                key={lvl}
                className={`debug-modal__filter ${filter === lvl ? "debug-modal__filter--active" : ""}`}
                style={lvl !== "all" ? { color: LEVEL_COLORS[lvl] } : undefined}
                onClick={() => setFilter(lvl)}
              >
                {lvl.toUpperCase()} ({counts[lvl]})
              </button>
            ))}
            <button className="debug-modal__p2p-btn" onClick={onP2PTest} title="Send P2P loopback message">
              P2P
            </button>
          </div>

          <div className="debug-modal__logs">
            {filtered.map((entry) => (
              <div key={entry.id} className="debug-modal__entry" style={{ color: LEVEL_COLORS[entry.level] }}>
                <span className="debug-modal__time">{formatTime(entry.timestamp)}</span>
                <span className="debug-modal__level">{LEVEL_LABELS[entry.level]}</span>
                <span className="debug-modal__msg">{entry.args}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          <div className="debug-modal__resize" onPointerDown={onPointerDown("resize")} />
        </>
      )}
    </div>
  );
}
