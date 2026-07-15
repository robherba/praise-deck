import { useState } from 'react';
import Input from './input';

interface SuggestionInputProps {
  value: string;
  className?: string;
  placeholder: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

export default function SuggestionInput({
  value,
  className,
  placeholder,
  suggestions,
  onChange,
}: SuggestionInputProps) {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 0) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setFilteredSuggestions([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
    }, 100);
  };

  const shouldShowSuggestions = filteredSuggestions.length > 0 && isFocused;

  return (
    <div
      className={`relative z-30 ${className}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={-1}
    >
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleInputChange}
      />
      {shouldShowSuggestions && (
        <ul className="p-2 overflow-scroll rounded-lg shadow-lg bg-[var(--bg-color)] absolute grid grid-cols-1 divide-y min-w-full max-h-[200px] mt-1">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-md py-2 cursor-pointer"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
