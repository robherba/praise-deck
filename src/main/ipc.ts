import { ipcMain, Menu, BrowserWindow } from 'electron';
import {
  addSong,
  getActiveSongs,
  getSize,
  getSongData,
  getSongs,
  updateSong,
  deleteSong,
  getSongTypes,
  addSongType,
  updateSongType,
  deleteSongType,
} from './db/database';
import { getCategories, getImagesFromCategory, generateMenuTemplate } from './ui/menu';

// Registers all IPC handlers for the main process.
export function registerIpcHandlers(): void {
  ipcMain.handle('add-song', async (_event, params: any) => {
    return await addSong(params);
  });

  ipcMain.handle('get-size', async (_event, params: any) => {
    return await getSize(params);
  });

  ipcMain.handle('get-songs', async (_event, params: any) => {
    return await getSongs(params);
  });

  ipcMain.handle('get-active-songs', async () => {
    return await getActiveSongs();
  });

  ipcMain.handle('update-song', async (_event, id: number, updatedFields: any) => {
    return await updateSong(id, updatedFields);
  });

  ipcMain.handle('delete-song', async (_event, id: number) => {
    return await deleteSong(id);
  });

  ipcMain.handle('get-song-data', async (_event, id: number) => {
    return await getSongData(id);
  });

  ipcMain.handle('get-categories', async () => {
    return await getCategories();
  });

  ipcMain.handle('get-images-from-category', async (_event, category: string) => {
    return await getImagesFromCategory(category);
  });

  ipcMain.handle('get-song-types', async () => {
    return await getSongTypes();
  });

  ipcMain.handle('add-song-type', async (_event, name: string) => {
    return await addSongType(name);
  });

  ipcMain.handle('update-song-type', async (_event, oldName: string, newName: string) => {
    return await updateSongType(oldName, newName);
  });

  ipcMain.handle('delete-song-type', async (_event, name: string) => {
    return await deleteSongType(name);
  });

  ipcMain.handle('send-message', (event, message: string, type: string) => {
    // Sends a message back to the renderer process.
    event.sender.send('message-from-electron', message, type);
  });

  ipcMain.handle('refresh-menu', async (event) => {
    try {
      const activeSongs = await getActiveSongs();
      const hasActiveSongs = Array.isArray(activeSongs) && activeSongs.length > 0;

      // Gets the browser window instance that sent the IPC message.
      const win = BrowserWindow.fromWebContents(event.sender);

      if (win) {
        const menuTemplate = generateMenuTemplate(win, hasActiveSongs);
        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
      }
    } catch (err) {
      console.error('Error refreshing menu:', err);
    }
  });
}
