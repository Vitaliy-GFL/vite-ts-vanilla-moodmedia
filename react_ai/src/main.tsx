import React from "react";
import ReactDOM from "react-dom/client";
import "mtemplate-loader/release/js/es6-shim.min.js";
import "mtemplate-loader/release/js/template-loader.js";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
