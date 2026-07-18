import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryImage } from '../hooks/use-category-image';
import { useKeyPress } from '../hooks/use-key-press';
import Button from '../components/ui/button';

import FullScreenIcon from '../assets/icons/full-screen.svg?react';
import CloseIcon from '../assets/icons/close.svg?react';
import HomeIcon from '../assets/icons/home.svg?react';

interface MenuCoords {
  top: number;
  left: number;
  visible: boolean;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  isH1: boolean;
  isH2: boolean;
  isCurrency: boolean;
  canConvertCurrency: boolean;
}

export default function NotesPage() {
  const navigate = useNavigate();
  const image = useCategoryImage('predeterminado');
  const editorRef = useRef<HTMLDivElement>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [menuCoords, setMenuCoords] = useState<MenuCoords>({ top: 0, left: 0, visible: false });
  
  const [formats, setFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    isH1: false,
    isH2: false,
    isCurrency: false,
    canConvertCurrency: false
  });

  // Effect to handle initialization, cleanups, and global listeners
  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('selectionchange', handleSelectionChange);

    // RESTORE TEMPORARY MEMORY: Retrieve previously typed content if it exists in the active session
    if (editorRef.current) {
      const savedContent = sessionStorage.getItem('temporary_note_content');
      if (savedContent) {
        editorRef.current.innerHTML = savedContent;
        setIsEmpty(editorRef.current.textContent?.trim().length === 0);
      }
      editorRef.current.focus();
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, []);

  // Helper function to evaluate current text styles and block tags accurately
  const updateFormatStates = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) return;

    const node = selection.anchorNode;
    if (!node || !editorRef.current.contains(node)) return;

    const parentElement = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    const closestBlock = parentElement?.closest('h1, h2, p');
    const selectedText = selection.toString().trim();

    const isCurrency = selectedText.includes('₡');
    
    // STRICT CHECK: The text must contain numbers only (and allow commas, periods, or spaces common in currency formatting)
    // It will return FALSE if there are characters like "Ninos"
    const isOnlyNumbers = /^[0-8\d\s.,₡]+$/.test(selectedText) && /\d/.test(selectedText);

    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      isH1: closestBlock?.tagName === 'H1',
      isH2: closestBlock?.tagName === 'H2',
      isCurrency: isCurrency,
      canConvertCurrency: isOnlyNumbers
    });
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setMenuCoords((prev) => ({ ...prev, visible: false }));
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const rect = range.getBoundingClientRect();
    
    updateFormatStates();

    setMenuCoords({
      top: rect.top + window.scrollY - 55,
      left: rect.left + window.scrollX + rect.width / 2,
      visible: true,
    });
  };

  const saveToSessionStorage = () => {
    if (!editorRef.current) return;
    const htmlContent = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent?.trim() ?? '';

    setIsEmpty(textContent.length === 0);

    if (textContent.length === 0 && editorRef.current.innerHTML === '') {
      sessionStorage.removeItem('temporary_note_content');
    } else {
      sessionStorage.setItem('temporary_note_content', htmlContent);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const textContent = e.currentTarget.textContent?.trim() ?? '';
    setIsEmpty(textContent.length === 0);
    saveToSessionStorage();
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveToSessionStorage();
    updateFormatStates();
  };

  // DEFINITIVE FIXED METHOD: Destroys nested tag trees by rewriting the selection slice directly
  const applyBlockTag = (tag: 'h1' | 'h2' | 'p') => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    
    // Extract the HTML content inside the user's raw selection slice
    const container = document.createElement('div');
    container.appendChild(range.cloneRange().extractContents());
    let rawHTML = container.innerHTML;

    // If selection returned empty inside the slice, grab closest block baseline alternative
    if (rawHTML.trim() === '' || rawHTML === '<br>') {
      const node = range.commonAncestorContainer;
      const parentElement = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      const closestBlock = parentElement?.closest('h1, h2, p, div');
      if (closestBlock && editorRef.current.contains(closestBlock) && closestBlock !== editorRef.current) {
        rawHTML = closestBlock.innerHTML;
        
        // Sanitize out malicious nested structural wrappers entirely
        const cleanHTML = rawHTML.replace(/<\/?(h1|h2|p|div)[^>]*>/gi, '').replace(/(<br\s*\/?>)+$/gi, '');
        const newBlock = document.createElement(tag);
        newBlock.innerHTML = cleanHTML || '&nbsp;';
        
        closestBlock.parentNode?.replaceChild(newBlock, closestBlock);
        
        const newRange = document.createRange();
        newRange.selectNodeContents(newBlock);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        editorRef.current.focus();
        saveToSessionStorage();
        setTimeout(() => updateFormatStates(), 15);
        return;
      }
    }

    // Sanitize out all existing structural elements from the selection string slice
    const sanitizedHTML = rawHTML.replace(/<\/?(h1|h2|p|div)[^>]*>/gi, '').replace(/(<br\s*\/?>)+$/gi, '');

    // Build an atomic clean DOM layout item
    const targetBlock = document.createElement(tag);
    targetBlock.innerHTML = sanitizedHTML || '&nbsp;';

    // Wipe out original dirty structure range and insert the replacement atom
    range.deleteContents();
    range.insertNode(targetBlock);

    // Clean up parent duplicates if they got left behind natively by the deletion slice
    const parent = targetBlock.parentElement;
    if (parent && parent !== editorRef.current && (parent.tagName === 'H1' || parent.tagName === 'H2' || parent.tagName === 'P')) {
      parent.replaceWith(targetBlock);
    }

    // Maintain focus layout positions cleanly
    const finalRange = document.createRange();
    finalRange.selectNodeContents(targetBlock);
    selection.removeAllRanges();
    selection.addRange(finalRange);

    editorRef.current.focus();
    saveToSessionStorage();
    
    setTimeout(() => {
      updateFormatStates();
    }, 15);
  };

  const clearFormatting = () => {
    document.execCommand('removeFormat', false);
    applyBlockTag('p');
  };

  const toggleCurrencyFormat = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !formats.canConvertCurrency) return;

    const selectedText = selection.toString().trim();
    const currentIsCurrency = selectedText.includes('₡');

    if (currentIsCurrency) {
      const cleanRaw = selectedText.replace(/[₡,\s.]/g, '');
      executeCommand('insertHTML', cleanRaw);
    } else {
      const rawDigits = selectedText.replace(/[^\d]/g, '');
      const cleanNumber = parseInt(rawDigits, 10);

      if (!isNaN(cleanNumber)) {
        const formattedWithCommas = cleanNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        executeCommand('insertHTML', `₡${formattedWithCommas}`);
      } else {
        executeCommand('insertHTML', `₡${selectedText}`);
      }
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoHome = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } finally {
      navigate('/');
    }
  };

  useKeyPress('Escape', handleGoHome);

  return (
    <main className="relative min-h-screen overflow-hidden select-none">
      <img
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        src={`media://${image}`}
        alt="background"
      />

      <div className="fixed top-4 right-4 z-50 flex gap-4 opacity-30 hover:opacity-100 transition-opacity duration-300">
        <Button type="button" title="Home" onClick={handleGoHome} icon={<HomeIcon className="w-5 h-5" />} />
        <Button
          type="button"
          title={isFullScreen ? 'Exit full screen' : 'Full screen'}
          onClick={toggleFullScreen}
          icon={isFullScreen ? <CloseIcon className="w-6 h-4" /> : <FullScreenIcon className="w-6 h-5" />}
        />
      </div>

      {/* FLOATING TEXT TOOLBAR */}
      {menuCoords.visible && (
        <div
          style={{ top: `${menuCoords.top}px`, left: `${menuCoords.left}px` }}
          className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-slate-900/95 p-2 text-white shadow-xl backdrop-blur-sm border border-slate-700/50"
        >
          <button 
            onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${formats.bold ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-white/20'}`}
          >
            Negrita
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${formats.italic ? 'bg-emerald-500 text-white' : 'hover:bg-white/20'}`}
          >
            Itálica
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${formats.underline ? 'bg-emerald-500 text-white' : 'hover:bg-white/20'}`}
          >
            Subrayado
          </button>
          
          <button 
            disabled={!formats.canConvertCurrency}
            onMouseDown={(e) => { e.preventDefault(); toggleCurrencyFormat(); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              formats.isCurrency 
                ? 'bg-emerald-500 text-white font-bold' 
                : !formats.canConvertCurrency 
                  ? 'opacity-40 cursor-not-allowed text-white/50 pointer-events-none' 
                  : 'hover:bg-white/20'
            }`}
          >
            Moneda
          </button>
          
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          
          <button 
            onMouseDown={(e) => { e.preventDefault(); applyBlockTag('h1'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${formats.isH1 ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-white/20'}`}
          >
            Título
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); applyBlockTag('h2'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${formats.isH2 ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-white/20'}`}
          >
            Subtítulo
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); applyBlockTag('p'); }} 
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${!formats.isH1 && !formats.isH2 ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-white/20'}`}
          >
            Párrafo
          </button>
          
          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <button 
            onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} 
            className="px-2.5 py-1 text-xs font-semibold rounded hover:bg-red-500/30 text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-[90%] max-w-6xl h-[85vh] flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-white/20 relative group">
          
          <div className="w-full max-w-[95%] overflow-y-auto max-h-[75vh] px-4 flex flex-col items-center justify-center min-h-full relative">
            
            {isEmpty && (
              <div className="absolute inset-0 pointer-events-none text-black/30 text-5xl font-body text-center select-none flex items-center justify-center z-0">
                Escriba aquí sus notas...
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              className="outline-none w-full text-center focus:outline-none focus:ring-0 relative z-10
                flex flex-col items-center justify-center gap-4
                font-normal text-black text-4xl leading-relaxed

                /* Strict rules for Heading (H1) -> Courgette Cursive */
                [&_h1]:font-heading [&_h1]:text-8xl [&_h1]:font-black [&_h1]:mb-2 [&_h1]:w-full
                [&>h1]:font-heading [&>h1]:text-8xl [&>h1]:font-black [&>h1]:mb-2 [&>h1]:w-full
                
                /* Strict rules for Subheading (H2) -> Courgette Cursive */
                [&_h2]:font-heading [&_h2]:text-6xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-center [&_h2]:w-full
                [&>h2]:font-heading [&>h2]:text-6xl [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:text-center [&>h2]:w-full
                
                /* Strict rules for Paragraph (P) -> Roboto Sans */
                [&_p]:font-body [&_p]:font-normal [&_p]:leading-relaxed [&_p]:mb-1 [&_p]:text-center [&_p]:w-full
                [&>p]:font-body [&>p]:font-normal [&>p]:leading-relaxed [&>p]:mb-1 [&>p]:text-center [&>p]:w-full
                
                [&_b]:font-black [&_strong]:font-black"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
