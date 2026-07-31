import { useEffect } from "react";

import AspectRatioContainer from "@/components/AspectRatioContainer";
import DebugModal from "@/components/DebugModal";
import ErrorScreen from "@/components/ErrorScreen";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "@/config/design";
import { installConsoleCapture, uninstallConsoleCapture } from "@/hooks/useConsoleCapture";
import { initTemplate, signalReady, signalError, waitForStart, getDuration } from "@/services/template-loader";
import { useTemplateStore } from "@/store/templateStore";

import "./styles/main.scss";
import { pxa } from "./utils/px";

function App() {
  const { isStarted, error, setComponents, setStarted, setReady, setDuration, setError } = useTemplateStore();
  const debugEnabled = useTemplateStore((s) => s.getParam<boolean>("debug", "enabled"));

  useEffect(() => {
    // Console capture is on from the first line of main.tsx so early logs are
    // not lost; once params are known, keep it only if debug is enabled.
    function applyConsoleCapture() {
      if (useTemplateStore.getState().getParam<boolean>("debug", "enabled")) {
        installConsoleCapture();
      } else {
        uninstallConsoleCapture();
      }
    }

    async function bootstrap() {
      try {
        const components = await initTemplate();
        setComponents(components);
        applyConsoleCapture();

        setDuration(getDuration());
        signalReady();
        setReady(true);

        await waitForStart();
        setStarted(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Template init error:", message);
        signalError("Failed to load template configuration: " + message);
        setError("Failed to load template configuration: " + message);
      }
    }

    if (window.Loader) {
      bootstrap();

      window.mvTemplate = {
        setComponents: (components) => {
          window.Loader.setComponents(components);
          setComponents(components);
          applyConsoleCapture();
        },
        render: () => {
          /* re-render triggered via React state */
        },
      };
    }
  }, [setComponents, setStarted, setReady, setDuration, setError]);

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!isStarted) {
    return null;
  }

  return (
    <div className="app">
      {debugEnabled && <DebugModal />}

      <AspectRatioContainer ratio={DESIGN_WIDTH / DESIGN_HEIGHT}>
        <h1 style={{ fontSize: pxa(40) }}>Harmony Template</h1>
      </AspectRatioContainer>
    </div>
  );
}

export default App;
