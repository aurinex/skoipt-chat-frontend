/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.svg?react" {
  import * as React from "react";
  const component: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default component;
}
