import { app, BrowserWindow, protocol, net } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { pathToFileURL } from 'url';

import { createMainWindow } from './ui/window';
import { dbConnection } from './db/database';
import { registerIpcHandlers } from './ipc'; 

// 1. Register the custom 'media' scheme as privileged.
// This must be called BEFORE the app is ready so Electron knows it's a secure scheme.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      bypassCSP: true, // Bypasses the CSP restrictions for loading images
      stream: true,
      corsEnabled: true,
      supportFetchAPI: true
    }
  }
]);

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  // 2. Define the protocol handler to safely resolve and serve local files.
  protocol.handle('media', (request) => {
    // Decodes the file path and strips 'media://' to build a standard local URL
    const filePath = request.url.replace('media://', '');
    try {
      const decodedPath = decodeURIComponent(filePath);
      return net.fetch(pathToFileURL(decodedPath).toString());
    } catch (err) {
      console.error('Error serving local file via media protocol:', err);
      return new Response('Not Found', { status: 404 });
    }
  });

  // Set app user model id for windows.
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Initialize database.
  dbConnection();

  // Register IPC communication channels.
  registerIpcHandlers();

  // Create the main application window.
  createMainWindow();

  // Re-create a window on macOS when the dock icon is clicked.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
