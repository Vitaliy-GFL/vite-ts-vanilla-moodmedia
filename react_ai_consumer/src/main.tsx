import React from "react";
import ReactDOM from "react-dom/client";
import "mtemplate-loader/release/js/es6-shim.min.js";
import "mtemplate-loader/release/js/template-loader.js";

import ErrorBoundary from "@/components/ErrorBoundary";
import { installConsoleCapture } from "@/hooks/useConsoleCapture";

import App from "./App";

installConsoleCapture();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
