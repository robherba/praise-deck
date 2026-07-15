import { dialog, BrowserWindow, shell } from 'electron';
import fs from 'fs/promises';
import { getActiveSongs } from '../db/database';

// Exports active songs to a PDF document.
export async function exportSongsPDF(mainWindow: BrowserWindow): Promise<void> {
  try {
    const songs = await getActiveSongs();
    
    if (!songs || songs.length === 0) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Exportar PDF',
        message: 'No hay cantos seleccionados.',
        detail: 'Por favor, selecciona al menos un canto antes de exportar.',
        buttons: ['Aceptar'],
      });
      return;
    }

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar cantos seleccionados como PDF',
      defaultPath: 'cantos-seleccionados.pdf',
      buttonLabel: 'Guardar PDF',
      filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return;

    const songsHTML = songs.map((song: any, index: number) => {
      const category = song.category ? String(song.category) : '';
      const number = song.number ? String(song.number) : '';
      const metaText = category && number
        ? `${category.charAt(0).toUpperCase() + category.slice(1)} - ${number}`
        : category || number || '';

      const slidesHTML = song.slides
        .map((slide: string) => `<div class="slide-text">${slide.trim()}</div>`)
        .join('');

      return `
        <div class="song-container">
          <div class="title">${song.title.toUpperCase()}</div>
          <div class="meta">${metaText}</div>
          <div class="slides-container">
            ${slidesHTML}
          </div>
        </div>
        ${index < songs.length - 1 ? '<hr />' : ''}
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #222; line-height: 1.5; }
          .song-container { margin-bottom: 30px; page-break-inside: avoid; }
          .title { font-size: 22px; font-weight: bold; margin-bottom: 2px; color: #000; text-transform: uppercase; }
          .meta { font-size: 13px; font-style: italic; color: #555; margin-bottom: 18px; }
          .slide-text { font-size: 15px; margin-bottom: 12px; white-space: pre-line; }
          hr { border: 0; border-top: 1px dashed #bbb; margin-top: 25px; margin-bottom: 25px; }
        </style>
      </head>
      <body>
        ${songsHTML}
      </body>
      </html>
    `;

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    printWindow.webContents.once('did-finish-load', async () => {
      try {
        const pdfData = await printWindow.webContents.printToPDF({
          printBackground: true,
          margins: { marginType: 'default' },
        });
        
        await fs.writeFile(filePath, pdfData);
        printWindow.destroy();

        mainWindow.webContents.send('message-from-electron', 'Los cantos seleccionados se exportaron a PDF correctamente.', 'success');
        shell.showItemInFolder(filePath);
      } catch (printErr) {
        printWindow.destroy();
        console.error('Error printing PDF:', printErr);
        mainWindow.webContents.send('message-from-electron', 'Error al generar el PDF.', 'error');
      }
    });

  } catch (error) {
    console.error('Error in exportSongsPDF:', error);
    mainWindow.webContents.send('message-from-electron', 'Ocurrió un error al intentar exportar los cantos.', 'error');
  }
}
