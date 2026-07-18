import { dialog, BrowserWindow, shell } from 'electron';
import fs from 'fs/promises';
import { getActiveSongs } from '../db/database';

export async function exportSongsPDF(mainWindow: BrowserWindow): Promise<void> {
  let printWindow: BrowserWindow | null = null;

  try {
    const songs = await getActiveSongs();
    
    if (!songs || songs.length === 0) {
      mainWindow.webContents.send('message-from-electron', 'No songs selected. Please select at least one song before exporting.', 'info');
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Export PDF',
        message: 'No songs selected.',
        detail: 'Please select at least one song before exporting.',
        buttons: ['OK'],
      });
      return;
    }

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save selected songs as PDF',
      defaultPath: 'selected-songs.pdf',
      buttonLabel: 'Save PDF',
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return;

    mainWindow.webContents.send('message-from-electron', 'Generating PDF file, please wait...', 'loading');

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

    printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    printWindow.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const pdfData = await printWindow!.webContents.printToPDF({
          printBackground: true,
          margins: { marginType: 'default' },
        });
        
        await fs.writeFile(filePath, pdfData);
        
        if (printWindow) {
          printWindow.destroy();
          printWindow = null;
        }

        mainWindow.webContents.send('message-from-electron', 'Selected songs successfully exported to PDF.', 'success');
        shell.showItemInFolder(filePath);
      } catch (printErr) {
        if (printWindow) {
          printWindow.destroy();
          printWindow = null;
        }
        console.error('Error printing PDF:', printErr);
        mainWindow.webContents.send('message-from-electron', 'Failed to generate PDF document.', 'error');
      }
    });

    printWindow.loadURL(`data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`);

  } catch (error) {
    if (printWindow) {
      printWindow.destroy();
    }
    console.error('Error in exportSongsPDF:', error);
    mainWindow.webContents.send('message-from-electron', 'An unexpected error occurred while exporting songs.', 'error');
  }
}
