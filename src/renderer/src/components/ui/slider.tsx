import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
} from 'react';

export interface SliderHandle {
  goToSlide: (index: number) => void;
}

interface SliderProps {
  children: React.ReactNode | React.ReactNode[];
  initialSlide?: number;
  className?: string;
}

const Slider = forwardRef<SliderHandle, SliderProps>(
  ({ children, initialSlide = 0, className = '' }, ref) => {
    const childrenArray = Array.isArray(children) ? children : [children];
    const [currentSlide, setCurrentSlide] = useState(initialSlide);
    const totalSlides = childrenArray.length;

    // Exponer método goToSlide al ref
    useImperativeHandle(ref, () => ({
      goToSlide: (index: number) => {
        if (index >= 0 && index < totalSlides) {
          setCurrentSlide(index);
        }
      },
    }));

    // Navegación por teclado
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          setCurrentSlide((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'ArrowRight') {
          setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalSlides]);

    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {childrenArray.map((child, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full group ${isActive ? 'current' : ''}`}
              style={{
                pointerEvents: isActive ? 'auto' : 'none',
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 10 : 0,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
export default Slider;
