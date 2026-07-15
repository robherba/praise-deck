import { ElectronAPI } from '@electron-toolkit/preload'
import { CustomAPI } from './index';

type ElectronAPI = typeof electronAPI;

declare global {
  interface Window {
    electron: ElectronAPI;
    api: CustomAPI;
  }
}

// Support for importing SVGs as React Components in Vite.
declare module '*.svg' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
