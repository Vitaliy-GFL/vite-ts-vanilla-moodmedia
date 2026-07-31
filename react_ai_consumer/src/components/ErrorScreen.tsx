import DebugModal from "@/components/DebugModal";
import { useTemplateStore } from "@/store/templateStore";

interface ErrorScreenProps {
  message: string;
}

export default function ErrorScreen({ message }: ErrorScreenProps) {
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
    </div>
  );
}
