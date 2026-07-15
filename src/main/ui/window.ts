import { BrowserWindow, Menu, screen, app } from 'electron';
import path from 'path';
import { generateMenuTemplate } from './menu';
import { getActiveSongs } from '../db/database';
import icon from '../../../resources/icon.png?asset'

export let mainWindow: BrowserWindow;

// Creates the main browser window.
function createWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  return new BrowserWindow({
    title: '',
    width,
    height,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // The preload script is compiled to the out/preload folder.
      preload: path.join(__dirname, '../preload/index.js'),
      // webSecurity: false,
    },
  });
}

// Opens developer tools in a detached window.
function openDevTools(window: BrowserWindow): void {
  setTimeout(() => {
    window.webContents.openDevTools({ mode: 'detach', activate: true });
  }, 2000);
}

// Initializes the main window and sets up the application menu.
export async function createMainWindow(): Promise<void> {
  mainWindow = createWindow();

  // Load the react application.
  if (process.env['ELECTRON_RENDERER_URL']) {
    // Development mode.
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    // Production mode.
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Build the initial menu immediately.
  const initialMenuTemplate = generateMenuTemplate(mainWindow, false);
  Menu.setApplicationMenu(Menu.buildFromTemplate(initialMenuTemplate));

  // Rebuild the menu with correct state once the database is ready.
  mainWindow.webContents.once('did-finish-load', async () => {
    let hasActiveSongs = false;
    try {
      const activeSongs = await getActiveSongs();
      hasActiveSongs = Array.isArray(activeSongs) && activeSongs.length > 0;
    } catch (err) {
      console.error('Error checking active songs after load:', err);
    }
    const menuTemplate = generateMenuTemplate(mainWindow, hasActiveSongs);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  });

  // Open developer tools automatically in development mode.
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  if (isDev) {
    openDevTools(mainWindow);
  }
}
