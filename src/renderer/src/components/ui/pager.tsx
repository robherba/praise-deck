import React from 'react';

type PagerProps = {
  currentPage: number;
  totalPages: number;
  visiblePages: number;
  onPageChange: (page: number) => void;
};

const Pager: React.FC<PagerProps> = ({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
}) => {
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPages = () => {
    const pages: number[] = [];
    const halfVisible = Math.floor(visiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage + 1 < visiblePages) {
      if (currentPage - halfVisible < 1) {
        endPage = Math.min(
          totalPages,
          endPage + (visiblePages - (endPage - startPage + 1))
        );
      } else if (currentPage + halfVisible > totalPages) {
        startPage = Math.max(
          1,
          startPage - (visiblePages - (endPage - startPage + 1))
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pages = getPages();

  return (
    pages?.length > 1 && (
      <nav aria-label="Page navigation example" className="my-8">
        <ul className="flex items-center -space-x-px h-10 text-base">
          {/* Botón Primero */}
          {currentPage > 1 && pages[0] > 1 && (
            <>
              <li>
                <button
                  onClick={() => handlePageChange(1)}
                  className="flex items-center justify-center px-4 h-10 leading-tight border border-[var(--border-color)] rounded-s-lg"
                  aria-label="First Page"
                >
                  Primera página
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="flex items-center justify-center px-4 h-10 leading-tight border border-[var(--border-color)]"
                  aria-label="Previous Page"
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
              </li>
            </>
          )}

          {/* Botones de Página */}
          {pages.map((page) => (
            <li key={page}>
              <button
                onClick={() => handlePageChange(page)}
                className={`flex items-center justify-center px-4 h-10 leading-tight border border-[var(--border-color)] ${
                  page === currentPage
                    ? 'text-[var(--bg-color)] bg-[var(--secondary-color)]'
                    : 'text-[var(--text-color)]'
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Botón Siguiente y Último */}
          {currentPage < totalPages && pages[pages.length - 1] < totalPages && (
            <>
              <li>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="flex items-center justify-center px-4 h-10 leading-tight border border-[var(--border-color)]"
                  aria-label="Next Page"
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="flex items-center justify-center px-4 h-10 leading-tight border border-[var(--border-color)] rounded-e-lg"
                  aria-label="Last Page"
                >
                  Última página
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    )
  );
};

export default Pager;
