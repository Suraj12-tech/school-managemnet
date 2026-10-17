/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TEACHER_PORTAL_MODE?: "demo" | "integrated";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
