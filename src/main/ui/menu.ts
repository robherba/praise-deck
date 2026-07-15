import { app, shell, dialog, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import moment from 'moment-timezone';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

import { exportSongsPDF } from '../services/export-songs.js';
import { dbImport, dbExport } from '../db/database';
import readPptx from '../services/import-ppt';
import readDoc from '../services/import-doc';

const configFilePath = path.join(app.getPath('userData'), 'config.json');

moment.tz.setDefault('America/Costa_Rica');

// Helper: in a react spa, we dont load new urls for different pages.
// Instead, we send an ipc message to react router to handle the navigation.
function navigateInReact(mainWindow: BrowserWindow, route: string, payload?: any): void {
  if (mainWindow) {
    mainWindow.webContents.send('navigate', { route, payload });
  }
}

function openSongForm(mainWindow: BrowserWindow): void {
  navigateInReact(mainWindow, '/song-form');
}

function openImportForm(mainWindow: BrowserWindow, data: any): void {
  navigateInReact(mainWindow, '/import-form', data);
}

function generateNumericId(): string {
  const numericId = Math.floor(Math.random() * 90000000) + 10000000;
  return numericId.toString();
}

function importPPT(mainWindow: BrowserWindow): void {
  dialog
    .showOpenDialog(mainWindow, {
      title: 'Seleccionar archivo PPT',
      buttonLabel: 'Importar',
      filters: [{ name: 'Presentaciones', extensions: ['ppt', 'pptx'] }],
      properties: ['openFile'],
    })
    .then(async ({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0) {
        const filePath = filePaths[0];
        const data = await readPptx(filePath);
        openImportForm(mainWindow, data);
      }
    })
    .catch(() => {
      mainWindow.webContents.send('import-data', 'fail');
    });
}

function importDOC(mainWindow: BrowserWindow): void {
  dialog
    .showOpenDialog(mainWindow, {
      title: 'Seleccionar archivo DOC',
      buttonLabel: 'Importar',
      filters: [{ name: 'Presentaciones', extensions: ['doc', 'docx'] }],
      properties: ['openFile'],
    })
    .then(async ({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0) {
        const filePath = filePaths[0];
        const data = await readDoc(filePath);
        openImportForm(mainWindow, data);
      }
    })
    .catch(() => {
      mainWindow.webContents.send('import-data', 'fail');
    });
}

function importBackup(mainWindow: BrowserWindow): void {
  dialog
    .showOpenDialog(mainWindow, {
      title: 'Seleccionar la base de datos',
      buttonLabel: 'Importar',
      filters: [{ name: 'Presentaciones', extensions: ['sql'] }],
      properties: ['openFile'],
    })
    .then(({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0) {
        const filePath = filePaths[0];
        dbImport(filePath, (message, type) => {
          mainWindow.reload();
          setTimeout(() => {
            mainWindow.webContents.send('message-from-electron', message, type);
          }, 1000);
        });
      }
    })
    .catch(() => {
      mainWindow.webContents.send('import-data', 'fail');
    });
}

function exportDB(mainWindow: BrowserWindow): void {
  const numericId = generateNumericId();
  const defaultFileName = `respaldo-${numericId}.sql`;

  dialog
    .showSaveDialog(mainWindow, {
      title: 'Seleccionar la ubicación para exportar la base de datos',
      defaultPath: defaultFileName,
      buttonLabel: 'Exportar',
      filters: [{ name: 'Base de datos', extensions: ['sql'] }],
      properties: [],
    })
    .then(async ({ canceled, filePath }) => {
      if (!canceled && filePath) {
        dbExport(filePath).then(() => {
          mainWindow.webContents.send('message-from-electron', 'La base de datos se exportó correctamente.');
        });
      }
    })
    .catch(() => {
      mainWindow.webContents.send(
        'message-from-electron',
        'Hubo un error al exportar la base de datos. Intenta nuevamente más tarde.',
        'error'
      );
    });
}

function loadCategoryPath(): string | null {
  try {
    if (fs.existsSync(configFilePath)) {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      return config.categoryPath || null;
    }
  } catch (error) {
    console.error('Error loading category path:', error);
  }
  return null;
}

function saveCategoryPath(categoryPath: string): void {
  try {
    const config = { categoryPath };
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving category path:', error);
  }
}

function setCategoryPath(mainWindow: BrowserWindow): void {
  dialog
    .showOpenDialog(mainWindow, {
      title: 'Seleccionar la ruta de categorías',
      properties: ['openDirectory'],
    })
    .then(({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0) {
        const selectedPath = filePaths[0];
        saveCategoryPath(selectedPath);
      }
    })
    .catch((error) => console.error('Error selecting category path:', error));
}

function openCategoryFolder(mainWindow: BrowserWindow): void {
  const categoryPath = loadCategoryPath();
  if (categoryPath) {
    shell
      .openPath(categoryPath)
      .then(() => console.log('Category folder opened successfully.'))
      .catch((error) => console.error('Error opening category folder:', error));
  } else {
    mainWindow.webContents.send('message-from-electron', 'Aún no se ha definido ninguna ruta de categorías.', 'warning');
  }
}

export function getCategories(): string[] {
  const categoryPath = loadCategoryPath();
  if (!categoryPath || !fs.existsSync(categoryPath)) return [];

  try {
    const files = fs.readdirSync(categoryPath);
    return files.filter((file) => fs.statSync(path.join(categoryPath, file)).isDirectory());
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
}

export function getImagesFromCategory(category: string): string[] {
  const categoryPath = loadCategoryPath();
  if (!categoryPath || !fs.existsSync(categoryPath)) return [];

  const categoryFolder = path.join(categoryPath, category);
  if (!fs.existsSync(categoryFolder) || !fs.statSync(categoryFolder).isDirectory()) return [];

  try {
    const files = fs.readdirSync(categoryFolder);
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
      })
      .map((image) => path.join(categoryFolder, image));
  } catch (error) {
    console.error('Error reading images from category:', error);
    return [];
  }
}

function openManageTypesDialog(mainWindow: BrowserWindow, mode: string): void {
  if (mainWindow) {
    mainWindow.webContents.send('open-manage-types', mode);
  }
}

async function checkOrphanedSongTypes(mainWindow: BrowserWindow): Promise<void> {
  const dbFile = path.join(app.getPath('userData'), 'praise-deck.db');
  const db = new sqlite3.Database(dbFile);

  db.all(
    `SELECT DISTINCT s.category
     FROM song s
     WHERE s.category IS NOT NULL
       AND s.category != ''
       AND LOWER(s.category) NOT IN (SELECT LOWER(name) FROM song_type)
     ORDER BY s.category ASC`,
    (err, rows: any[]) => {
      db.close();
      if (err) {
        console.error('Error checking orphaned song types:', err);
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Error',
          message: 'No se pudo realizar la verificación.',
          detail: err.message,
          buttons: ['Aceptar'],
        });
        return;
      }

      if (!rows || rows.length === 0) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '✅ Todo en orden',
          message: 'No se encontraron tipos perdidos.',
          detail: 'Todos los cantos tienen un tipo válido registrado en la lista de tipos.',
          buttons: ['Aceptar'],
        });
      } else {
        const typesList = rows.map((r) => `  • ${r.category}`).join('\n');
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: '⚠️ Tipos perdidos encontrados',
          message: `Se encontraron ${rows.length} tipo(s) que no están en la lista de tipos:`,
          detail: `${typesList}\n\nEstos cantos seguirán existiendo, pero su tipo no está registrado. Puedes agregarlos desde Gestionar > Tipos > Agregar nuevo tipo.`,
          buttons: ['Aceptar'],
        });
      }
    }
  );
}

function openDriveBackups(mainWindow: BrowserWindow): void {
  const driveWindow = new BrowserWindow({
    parent: mainWindow,
    width: 1000,
    height: 700,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  driveWindow.loadURL('https://drive.google.com/drive/folders/1f2HEntQGnCRXJXiPc-7B2K0DvWdkABtY?usp=sharing');

  driveWindow.once('ready-to-show', () => {
    driveWindow.show();
  });
}

async function checkForUpdates(mainWindow: BrowserWindow): Promise<void> {
  const currentVersion = app.getVersion();
  const repoOwner = 'robherba';
  const repoName = 'praise-deck';
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'praise-deck-app' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Versión actual',
          message: `Versión actual: ${currentVersion}\n\nAún no hay versiones publicadas.`,
          buttons: ['Aceptar'],
        });
        return;
      }
      throw new Error(`Error de red: ${response.statusText}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (latestVersion !== currentVersion) {
      const { response: btnIdx } = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización Disponible',
        message: `¡Hay una nueva versión disponible!\n\nVersión actual: ${currentVersion}\nNueva versión: ${latestVersion}`,
        buttons: ['Descargar', 'Cancelar'],
        defaultId: 0,
      });

      if (btnIdx === 0) shell.openExternal(release.html_url);
    } else {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualizado',
        message: `Estás usando la última versión.\n\nVersión actual: ${currentVersion}`,
        buttons: ['Aceptar'],
      });
    }
  } catch (error: any) {
    console.error('Error checking updates:', error);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error',
      message: 'No se pudo verificar si hay actualizaciones.',
      detail: error.message,
      buttons: ['Aceptar'],
    });
  }
}

export function generateMenuTemplate(mainWindow: BrowserWindow, hasActiveSongs = false): MenuItemConstructorOptions[] {
  return [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Nuevo canto', accelerator: 'CmdOrCtrl+N', click: () => openSongForm(mainWindow) },
        { type: 'separator' },
        {
          label: 'Importar',
          submenu: [
            { label: 'Base de datos', click: () => importBackup(mainWindow) },
            { type: 'separator' },
            { label: 'Presentación PowerPoint', click: () => importPPT(mainWindow) },
            { label: 'Documento de Word', click: () => importDOC(mainWindow) },
          ],
        },
        {
          label: 'Exportar',
          submenu: [
            { label: 'Base de datos', click: () => exportDB(mainWindow) },
            {
              label: 'Cantos seleccionados (PDF)',
              enabled: hasActiveSongs,
              click: () => exportSongsPDF(mainWindow),
            },
          ],
        },
        { type: 'separator' },
        { label: 'Reiniciar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Pegar y mantener formato', role: 'pasteAndMatchStyle' },
        { label: 'Eliminar', role: 'delete' },
        { type: 'separator' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Gestionar',
      submenu: [
        {
          label: 'Categorías',
          submenu: [
            { label: 'Abrir carpeta', click: () => openCategoryFolder(mainWindow) },
            { label: 'Definir nueva ruta', click: () => setCategoryPath(mainWindow) },
          ],
        },
        {
          label: 'Tipos',
          submenu: [
            { type: 'separator' },
            { label: 'Agregar', click: () => openManageTypesDialog(mainWindow, 'add') },
            { label: 'Renombrar', click: () => openManageTypesDialog(mainWindow, 'edit') },
            { label: 'Eliminar', click: () => openManageTypesDialog(mainWindow, 'delete') },
            { type: 'separator' },
            { label: 'Verificar tipos perdidos', click: () => checkOrphanedSongTypes(mainWindow) },
          ],
        },
        { type: 'separator' },
        { label: 'Respaldos', click: () => openDriveBackups(mainWindow) },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Acerca de', click: () => checkForUpdates(mainWindow) },
      ],
    },
  ];
}
