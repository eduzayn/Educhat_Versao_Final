import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContactPaginationProps {
  currentPage: number;
  totalPages: number;
  totalContacts: number;
  contactsPerPage: number;
  onPageChange: (page: number) => void;
}

export function ContactPagination({
  currentPage,
  totalPages,
  totalContacts,
  contactsPerPage,
  onPageChange,
}: ContactPaginationProps) {
  const startContact = (currentPage - 1) * contactsPerPage + 1;
  const endContact = Math.min(currentPage * contactsPerPage, totalContacts);

  const getVisiblePages = (): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    const pages: (number | string)[] = [];

    if (currentPage - delta > 2) {
      pages.push(1, "...");
    } else {
      for (let i = 1; i < Math.max(2, currentPage - delta); i++) {
        pages.push(i);
      }
    }

    pages.push(...range);

    if (currentPage + delta < totalPages - 1) {
      pages.push("...", totalPages);
    } else {
      for (let i = currentPage + delta + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:px-6">
      {/* Info */}
      <div>
        <p className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{startContact}</span> a{" "}
          <span className="font-medium">{endContact}</span> de{" "}
          <span className="font-medium">{totalContacts}</span> contatos
        </p>
      </div>

      {/* Paginação */}
      <nav
        className="inline-flex items-center gap-1"
        aria-label="Navegação de páginas"
      >
        {/* Botão anterior */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Páginas */}
        {getVisiblePages().map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-sm text-gray-500 select-none"
            >
              ...
            </span>
          ) : (
            <Button
              key={`page-${page}`}
              size="sm"
              variant={currentPage === page ? "default" : "outline"}
              className={
                currentPage === page
                  ? "bg-educhat-primary border-educhat-primary text-white"
                  : "text-gray-600"
              }
              onClick={() => onPageChange(page as number)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ),
        )}

        {/* Botão próximo */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}