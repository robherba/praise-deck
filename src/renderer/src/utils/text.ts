export const toSentenceCase = (str: string) => {
  if (!str) return '';

  const keywords = ['Dios', 'Señor', 'Jehova', 'Jesús', 'Jesus', 'Jesucristo'];

  // Convert the entire string to lowercase
  let result = str.toLowerCase();

  // Check for leading punctuation like ¡ or ¿
  const match = result.match(/^([¡¿])?(.*)/);
  if (!match) return str;

  const [, punctuation = '', content] = match;

  // Capitalize the first letter after the punctuation
  const capitalized = content.charAt(0).toUpperCase() + content.slice(1);
  result = punctuation + capitalized;

  // Restore specific keywords with correct casing
  keywords.forEach(word => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'g');
    result = result.replace(regex, word);
  });

  // Ensure the sentence ends with a period if it doesn't already end with punctuation
  if (!/[.!?…]$/.test(result.trim())) {
    result += '.';
  }

  return result;
};
