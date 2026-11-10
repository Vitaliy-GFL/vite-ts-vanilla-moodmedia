import DebugModal from "@/components/DebugModal";
import { useTemplateStore } from "@/store/templateStore";
import { BROWSER } from "@/utils/browser";

interface ErrorScreenProps {
  message: string;
  stack?: string;
}

export default function ErrorScreen({ message, stack }: ErrorScreenProps) {
  // This screen is the ErrorBoundary fallback — it must never throw itself, and
  // mframe may not have loaded at all. On any doubt, default to showing the console.
  const debugEnabled =
    useTemplateStore((s) => {
      try {
        return s.getParam<boolean>("debug", "enabled");
      } catch {
        return undefined;
      }
    }) ?? true;

  return (
    <div className="app app--error">
      {debugEnabled && <DebugModal />}
      <p className="app__error-title">Template Error</p>
      <p className="app__error-message">{message}</p>
      <p className="app__error-info">
        {BROWSER}
        <br />
        {navigator.userAgent}
      </p>
      {stack && <pre className="app__error-stack">{stack}</pre>}
    </div>
  );
}
