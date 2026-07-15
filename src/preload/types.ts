export interface CustomAPI {
  addSong: (params: any) => Promise<any>;
  getSongs: (params: any) => Promise<any[]>;
  getSize: (params: any) => Promise<number>;
  getActiveSongs: () => Promise<any[]>;
  getSongData: (id: number) => Promise<any>;
  getFileData: (data: any) => void;
  updateSong: (id: number, values: any) => Promise<void>;
  deleteSong: (id: number) => Promise<any>;
  removeFileDataListener: (callback: (...args: any[]) => void) => void;
  onFileData: (callback: (fileContent: any) => void) => void;
  getCategories: (items?: any) => Promise<string[]>;
  getImagesFromCategory: (items: any) => Promise<string[]>;
  getSongTypes: () => Promise<string[]>;
  addSongType: (name: string) => Promise<any>;
  updateSongType: (oldName: string, newName: string) => Promise<any>;
  deleteSongType: (name: string) => Promise<any>;
  refreshMenu: () => Promise<void>;
  onOpenManageTypes: (callback: (mode: string) => void) => void;
  removeOpenManageTypes: (callback: (...args: any[]) => void) => void;
  receiveMessage: (callback: (message: string, type: string) => void) => void;
  removeReceiveMessage: (callback: (...args: any[]) => void) => void;
  onNavigate: (callback: (route: string, payload?: any) => void) => void;
  removeNavigateListener: (callback: (...args: any[]) => void) => void;
}
