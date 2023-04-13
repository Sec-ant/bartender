/// <reference types="../types/index.d.ts"/>
/// <reference types="../types/vite-env.d.ts"/>
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./components/App.js";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
