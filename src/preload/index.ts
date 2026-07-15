import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { CustomAPI } from './types'; // Ajusta la ruta si tu interfaz CustomAPI vive en otro archivo de tipos

// 1. Implementamos CADA UNA de las funciones físicas usando ipcRenderer
const api: CustomAPI = {
  addSong: (params) => ipcRenderer.invoke('add-song', params),
  getSongs: (params) => ipcRenderer.invoke('get-songs', params),
  getSize: (params) => ipcRenderer.invoke('get-size', params),
  getActiveSongs: () => ipcRenderer.invoke('get-active-songs'),
  getSongData: (id) => ipcRenderer.invoke('get-song-data', id),
  getFileData: (data) => ipcRenderer.send('get-file-data', data),
  updateSong: (id, values) => ipcRenderer.invoke('update-song', id, values),
  deleteSong: (id) => ipcRenderer.invoke('delete-song', id),
  
  onFileData: (callback) => {
    ipcRenderer.on('file-data', (_event, fileContent) => callback(fileContent));
  },
  removeFileDataListener: (callback) => {
    ipcRenderer.removeListener('file-data', callback);
  },

  getCategories: (items) => ipcRenderer.invoke('get-categories', items),
  getImagesFromCategory: (items) => ipcRenderer.invoke('get-images-from-category', items),
  getSongTypes: () => ipcRenderer.invoke('get-song-types'),
  addSongType: (name) => ipcRenderer.invoke('add-song-type', name),
  updateSongType: (oldName, newName) => ipcRenderer.invoke('update-song-type', oldName, newName),
  deleteSongType: (name) => ipcRenderer.invoke('delete-song-type', name),
  refreshMenu: () => ipcRenderer.invoke('refresh-menu'),

  onOpenManageTypes: (callback) => {
    ipcRenderer.on('open-manage-types', (_event, mode) => callback(mode));
  },
  removeOpenManageTypes: (callback) => {
    ipcRenderer.removeListener('open-manage-types', callback);
  },

  receiveMessage: (callback) => {
    ipcRenderer.on('receive-message', (_event, message, type) => callback(message, type));
  },
  removeReceiveMessage: (callback) => {
    ipcRenderer.removeListener('receive-message', callback);
  },

  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (_event, route, payload) => callback(route, payload));
  },
  removeNavigateListener: (callback) => {
    ipcRenderer.removeListener('navigate', callback);
  }
};

// 2. Registramos FÍSICAMENTE los objetos en el navegador
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api); // 👈 ¡Esto es lo que crea físicamente el objeto en el navegador!
  } catch (error) {
    console.error('Error inyectando el preload con contextBridge:', error);
  }
} else {
  // Fallback para entornos no aislados
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}