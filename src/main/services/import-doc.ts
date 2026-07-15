import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';

// Types and interfaces.
export interface FinalSong {
  number: number;
  title: string;
  slides: string[];
}

interface IndexItem {
  number: string;
  title: string;
  titleNorm: string;
}

interface RawSong {
  number: string;
  title: string;
  titleNorm: string;
  blocks: Element[];
}

interface ProcessedSong {
  number: string;
  title: string;
  titleNorm: string;
  slides: string[];
}

interface DocumentErrors {
  missingInDocument: IndexItem[];
  missingInIndex: { number: string; title: string }[];
}

interface ProcessDocumentResult {
  songs: FinalSong[];
  errors: DocumentErrors;
}

// Normalizes text by removing accents, converting to uppercase, and trimming.
function normalizeText(str: string = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// Processes the raw HTML content extracted from the document.
function processDocument(html: string): ProcessDocumentResult {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract index.
  const index: IndexItem[] = [];
  const table = document.querySelector('table');

  if (table) {
    const rows = Array.from(table.querySelectorAll('tr')) as HTMLTableRowElement[];
    rows.forEach((tr: HTMLTableRowElement) => {
      const firstCell = tr.children[0];
      const secondCell = tr.children[1];

      if (!firstCell || !secondCell) return;

      const titles = Array.from(firstCell.querySelectorAll('p'));
      const numbers = Array.from(secondCell.querySelectorAll('p'));

      titles.forEach((p, i) => {
        const titleText = p.textContent?.trim() || '';
        const numberText = numbers[i]?.textContent?.trim() || '';

        index.push({
          number: numberText,
          title: titleText,
          titleNorm: normalizeText(titleText),
        });
      });
    });
  }

  // Extract raw song blocks.
  const paragraphs = Array.from(document.body.querySelectorAll('p')) as HTMLParagraphElement[];
  const rawSongs: RawSong[] = [];
  let current: RawSong | null = null;

  paragraphs.forEach((p) => {
    const strong = p.querySelector('strong');

    if (strong) {
      const fullText = (p.textContent || '').replace(/\s+/g, ' ').trim();
      const match = fullText.match(/^(\d+)\s*-\s*(.+)$/);

      if (match) {
        if (current) rawSongs.push(current);

        current = {
          number: match[1],
          title: match[2].trim(),
          titleNorm: normalizeText(match[2]),
          blocks: [],
        };
        return;
      }
    }

    if (current) {
      current.blocks.push(p);
    }
  });

  if (current) rawSongs.push(current);

  // Process song content.
  const processedSongs: ProcessedSong[] = rawSongs.map((song) => {
    const slides: string[] = [];

    song.blocks.forEach((p) => {
      const text = p.textContent?.trim();
      if (!text) return;

      // Remove time signature.
      if (/^\d+\/\d+$/.test(text)) return;

      // Remove numeric count lines.
      if (/^[\d\s]+$/.test(text)) return;

      // Remove chord lines.
      const chordOnly = /^[A-G][#bm]?(?:\s+[A-G][#bm]?)*$/;
      const chordSpaced = /[A-G][#bm]?.*\s{2,}.*[A-G][#bm]?/;

      if (chordOnly.test(text) || chordSpaced.test(text)) return;

      // Remove author line.
      if (slides.length === 0 && text.split(/\s+/).length === 2) {
        return;
      }

      slides.push(text);
    });

    return {
      number: song.number,
      title: song.title,
      titleNorm: song.titleNorm,
      slides,
    };
  });

  // Merge index and document songs.
  const songMap = new Map<string, ProcessedSong>();
  processedSongs.forEach((song) => {
    if (song.slides.length > 0) {
      songMap.set(song.number, song);
    }
  });

  const finalSongs: FinalSong[] = [];
  const errors: DocumentErrors = {
    missingInDocument: [],
    missingInIndex: [],
  };

  // Add songs from index with preferred titles.
  index.forEach((item) => {
    const song = songMap.get(item.number);

    if (!song) {
      errors.missingInDocument.push(item);
    } else {
      finalSongs.push({
        number: parseInt(item.number, 10),
        title: item.title,
        slides: song.slides,
      });

      songMap.delete(item.number);
    }
  });

  // Add remaining songs not present in index.
  songMap.forEach((song) => {
    finalSongs.push({
      number: parseInt(song.number, 10),
      title: song.title,
      slides: song.slides,
    });

    errors.missingInIndex.push({
      number: song.number,
      title: song.title,
    });
  });

  // Sort songs by number.
  finalSongs.sort((a, b) => a.number - b.number);

  return {
    songs: finalSongs,
    errors,
  };
}

// Reads and processes a word document to extract songs.
export default async function readDoc(filePath: string): Promise<FinalSong[]> {
  try {
    const options = {
      convertImage: mammoth.images.imgElement(async () => ({ src: '' })),
    };

    const result = await mammoth.convertToHtml({ path: filePath }, options);
    const html = result.value;

    const { songs } = processDocument(html);
    return songs?.length ? songs : [];
  } catch (error) {
    console.error('Error reading document:', error);
    throw error;
  }
}
