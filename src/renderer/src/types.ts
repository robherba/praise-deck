export interface SearchFormProps {
  onSearch: (data: SearchFormData) => void;
}

export interface SearchFormData {
  searchText?: string;
  category?: string;
}

export interface SongSearchParams {
  formData?: SearchFormData;
  pageSize: number;
  currentPage: number;
}

export interface ImportFormData {
  songs: Song[];
  category: string;
}

export interface CategoriesProps {
  value: string;
  onChange: (value: string) => void;
}

export type CategoryData = Record<
  string,
  {
    label: string;
    description: string;
  }
>;

export interface Song {
  id: number;
  title: string;
  tags: string | null;
  number: number | null;
  category: string | null;
  slides: string[];
  translations?: string[];
  active: boolean;
}

export interface SongDatabase {
  id: number;
  title: string;
  tags: string | null;
  number: number | null;
  category: string | null;
  slides: string | null;
  translations?: string | null;
  active: boolean;
}

export interface SongFormType {
  id?: string;
  title?: string;
  tags?: string;
  number?: number;
  category?: string;
  slides?: string[];
  active?: boolean;
  chorus?: number[];
  translations?: string[];
}

export type SongDataType = string | string[] | number;

export interface MessageType {
  text: string;
  type: 'success' | 'error' | 'warning';
}

export type DataType = Record<string, any>;
