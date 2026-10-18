/// <reference types="vite/client" />

interface ImportMetaEnv {
  // The room server's WebSocket URL; without it the app is solo only
  readonly VITE_ROOM_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
