import * as unzipper from 'unzipper';
import xml2js from 'xml2js';

// Types and interfaces.

export interface FinalSong {
  number: number;
  title: string;
  slides: string[];
}

interface RunResult {
  text?: string;
  link?: string;
}

interface SongIndexItem {
  text: string;
  link?: string;
}

// XML parser helper.
const parseXml = (xml: string): Promise<any> => {
  const parser = new xml2js.Parser();
  return parser.parseStringPromise(xml);
};

// Extracts slide files and their relationships from the PPTX archive.
const extractSlideFiles = async (filePath: string) => {
  const directory = await unzipper.Open.file(filePath);
  
  const slideFiles = directory.files.filter(
    (file) => file.path.startsWith('ppt/slides/slide') && file.path.endsWith('.xml')
  );

  const slideRels = directory.files.filter(
    (file) => file.path.startsWith('ppt/slides/_rels/slide') && file.path.endsWith('.xml.rels')
  );

  return { slideFiles, slideRels };
};

// Extracts the core slide data from a slide XML file.
const extractSlidesData = async (slideFile: unzipper.File): Promise<any[]> => {
  const content = await slideFile.buffer();
  const xmlContent = content.toString();
  const parsedXml = await parseXml(xmlContent);

  if (parsedXml && parsedXml['p:sld'] && parsedXml['p:sld']['p:cSld']) {
    const slidesData = parsedXml['p:sld']['p:cSld'];
    return slidesData || [];
  }

  return [];
};

// Extracts hyperlink relationships from a slide's .rels file.
const extractRelsData = async (slideFile: unzipper.File): Promise<Record<string, string>> => {
  const relations: Record<string, string> = {};
  const content = await slideFile.buffer();
  const xmlContent = content.toString();
  const parsedXml = await parseXml(xmlContent);

  if (parsedXml && parsedXml['Relationships'] && parsedXml['Relationships']['Relationship']) {
    const relationships = parsedXml['Relationships']['Relationship'];
    for (const relationship of relationships) {
      if (relationship['$']['Target'].startsWith('slide')) {
        relations[relationship['$']['Id']] = relationship['$']['Target'];
      }
    }
  }
  return relations;
};

// Extracts the numeric slide index from a file path.
const getSlideIndex = (data?: string): string => {
  const match = data?.match(/slide(\d+)\.xml/);
  return match?.length ? match[1] : '';
};

// Extracts text and links from a slide's shape tree.
const extractTextFromSlide = (
  slideData: any,
  index: string,
  relations: Record<string, Record<string, string>>
): RunResult[] => {
  const results: RunResult[] = [];
  const rids = relations[index];

  if (slideData['p:spTree']) {
    const shapes = slideData['p:spTree'][0]['p:sp'] || [];
    shapes.forEach((shape: any) => {
      const textBody = shape['p:txBody'];
      if (textBody && textBody[0]['a:bodyPr']) {
        const paragraphs = textBody[0]['a:p'] || [];
        paragraphs.forEach((paragraph: any) => {
          const runs = paragraph['a:r'] || [];
          runs.forEach((run: any) => {
            const result: RunResult = {};
            
            if (run['a:t']) {
              result.text = run['a:t'][0];
            }

            if (rids && run['a:rPr'] && run['a:rPr'][0] && run['a:rPr'][0]['a:hlinkClick']) {
              const rid = run['a:rPr'][0]['a:hlinkClick'][0]['$']['r:id'];
              const slideTarget = rids[rid];
              if (slideTarget) {
                result.link = getSlideIndex(slideTarget);
              }
            }

            if (result.text || result.link) {
              results.push(result);
            }
          });
        });
      }
    });
  }
  return results;
};

// Merges text blocks that point to the same slide link.
const mergeArrayByLink = (arr: RunResult[]): SongIndexItem[] => {
  const merged: SongIndexItem[] = [];

  arr.forEach((item) => {
    if (!item.text) return;

    const existingItem = merged.find((el) => el.link === item.link);

    if (existingItem) {
      existingItem.text += item.text.trim();
    } else {
      merged.push({ text: item.text, link: item.link });
    }
  });

  return merged;
};

// Splits a combined text string into a song number and title.
const extractNumberAndTitle = (item: SongIndexItem): { songNumber: string | null; songTitle: string } => {
  const regex = /^(\d+)\s*[-.:/]*\s*(.*)$/;
  const match = item.text.match(regex);

  if (match) {
    return { songNumber: match[1], songTitle: match[2].trim() };
  }

  return { songNumber: null, songTitle: item.text };
};

// Gets the concatenated text content for a range of slides.
const getValuesInRange = (slides: Record<string, RunResult[]>, start: number, end: number): string[] => {
  const result: string[] = [];

  for (const key in slides) {
    const numericKey = parseInt(key, 10);
    if (numericKey >= start && numericKey < end) {
      let textContent = '';
      for (const slide of slides[key]) {
        if (slide.text) {
          textContent += slide.text;
        }
      }
      if (textContent) {
        result.push(textContent);
      }
    }
  }

  return result;
};

// Finds the next numeric value in a sorted array to determine slide ranges.
const getNextValue = (array: string[], currentNumber: string): string | undefined => {
  const currentNumberParsed = parseFloat(currentNumber);
  const index = array.findIndex((item) => parseFloat(item) === currentNumberParsed);
  
  if (index >= 0 && index < array.length - 1) {
    return array[index + 1];
  }
  return undefined;
};

// Sorts slide indices numerically.
const getSortedIndices = (items: SongIndexItem[]): string[] => {
  return items
    .map((item) => item.link)
    .filter((link): link is string => link !== null && link !== '' && link !== undefined)
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
    });
};

// Main parser.

// Reads and processes a powerpoint presentation to extract songs.
export default async function readPptx(filePath: string): Promise<FinalSong[] | undefined> {
  try {
    const { slideFiles, slideRels } = await extractSlideFiles(filePath);
    const slides: Record<string, RunResult[]> = {};
    const relations: Record<string, Record<string, string>> = {};

    // Get slides references.
    if (slideRels?.length > 0) {
      for (const slideRel of slideRels) {
        const response = await extractRelsData(slideRel);
        const index = getSlideIndex(slideRel.path);

        if (response && Object.keys(response).length > 3) {
          relations[index] = response;
        }
      }
    }

    // Get slides data.
    if (slideFiles?.length > 0) {
      for (const slideFile of slideFiles) {
        const slidesData = await extractSlidesData(slideFile);
        for (const slideData of slidesData) {
          const index = getSlideIndex(slideFile.path);
          const response = extractTextFromSlide(slideData, index, relations);
          slides[index] = response;
        }
      }
    } else {
      console.log('No slides found in the presentation.');
    }

    const slideKeys = Object.keys(slides);
    const relationKeys = Object.keys(relations);

    if (slideKeys.length > 0 && relationKeys.length > 0) {
      const songs: FinalSong[] = [];
      
      const songIndex = relationKeys
        .filter((index) => slides[index])
        .flatMap((index) => mergeArrayByLink(slides[index]));
        
      const sortedIndices = getSortedIndices(songIndex);

      for (const item of songIndex) {
        if (!item.link) continue;

        const endValue = getNextValue(sortedIndices, item.link);
        const end = endValue ? parseInt(endValue, 10) : slideKeys.length + 1;

        if (item.text) {
          const { songNumber, songTitle } = extractNumberAndTitle(item);
          const songSlides = getValuesInRange(slides, parseInt(item.link, 10), end);

          const song: FinalSong = {
            title: songTitle,
            slides: songSlides,
            number: songNumber ? parseInt(songNumber, 10) : 0,
          };

          songs.push(song);
        }
      }

      return songs;
    }
    return undefined;
  } catch (error) {
    console.error('Error reading the presentation:', error);
    throw error;
  }
}
