'use client';

import { useCategoryImage } from '../../hooks/use-category-image';
import React, { useMemo } from 'react';

type HeaderProps = {
  children: string;
  showImage?: boolean;
  actionSlot?: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ children, showImage = true, actionSlot }) => {
  const image = useCategoryImage(showImage ? 'portada' : '');

  const renderedImage = useMemo(() => {
    if (!image) return;

    return (
      <>
        <img
          className="w-full h-[300px] absolute top-0 left-0 object-cover -z-10"
          src={`media://${image}`} // Local path or file URL returned from Electron
          alt="icon"
        />
        {/* Dark overlay to ensure white text readability */}
        <div className="w-full h-[300px] absolute top-0 left-0 bg-black/35 -z-10" />
      </>
    )
  }, [image]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center w-full relative max-md:mt-12 mb-12">
        <h1
          className={`text-4xl font-600 leading-none tracking-tight md:text-5xl lg:text-6xl font-heading z-10 ${
            renderedImage ? 'text-white' : 'text-[var(--text-color)]'
          }`}
          style={
            image
              ? { textShadow: 'var(--header-text-shadow)' }
              : undefined
          }
        >
          {children}
        </h1>
        {!!actionSlot && (
          <div className="flex gap-4 mt-8 absolute right-0 bottom-4">
            {actionSlot}
          </div>
        )}
      </div>
      {renderedImage}
    </div>
  );
};

export default Header;

