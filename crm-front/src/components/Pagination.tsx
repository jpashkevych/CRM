import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsOnPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemsOnPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-sm text-gray-600">
        Показано {itemsOnPage} з {totalItems} елементів
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                page === p
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
