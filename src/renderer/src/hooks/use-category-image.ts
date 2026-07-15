import { useEffect, useState } from 'react';

// Gets a random image from the provided list.
function getRandomImage(images: string[]): string {
  if (images.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

// Custom hook to fetch a random image for a specific category.
export function useCategoryImage(category: string): string {
  const [image, setImage] = useState<string>('');

  useEffect(() => {
    // Safety check: Exit early if category is missing or the Electron API isn't ready yet.
    if (!category || !window.api) {
      setImage('');
      return;
    }

    let isMounted = true;

    async function fetchCategoryImage(): Promise<void> {
      try {
        if (window.api && typeof window.api.getImagesFromCategory === 'function') {
          const images = await window.api.getImagesFromCategory(category);
          
          if (isMounted) {
            const randomImage = getRandomImage(images);
            setImage(randomImage);
          }
        }
      } catch (error) {
        console.error(`Error loading images for category: ${category}`, error);
        if (isMounted) {
          setImage('');
        }
      }
    }

    fetchCategoryImage();

    return () => {
      isMounted = false;
    };
  }, [category, window.api]);

  return image;
}
