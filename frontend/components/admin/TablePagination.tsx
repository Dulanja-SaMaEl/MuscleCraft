'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export default function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 8, 10, 25],
  itemLabel = 'items',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  // Build compact page number list with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="px-4 sm:px-5 py-3.5 bg-[#14141c] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Left: Range summary & Page size selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-gray-400">
        <span>
          Showing{' '}
          <strong className="text-white font-mono">
            {startIndex}–{endIndex}
          </strong>{' '}
          of <strong className="text-white font-mono">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
            <label htmlFor={`page-size-${itemLabel}`} className="text-[11px] text-gray-400">
              Rows:
            </label>
            <div className="relative">
              <select
                id={`page-size-${itemLabel}`}
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="appearance-none bg-[#1a1a24] hover:bg-[#20202c] border border-white/10 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-mono text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 cursor-pointer transition-colors"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#161620] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right: Page controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          aria-label="First page"
          title="First page"
          className="p-2 rounded-lg border border-white/[0.08] bg-[#1a1a24] text-gray-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          title="Previous page"
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-[#1a1a24] text-gray-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors min-h-[34px] flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`el-${idx}`} className="px-1.5 text-gray-500 font-mono select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className={`min-w-[34px] min-h-[34px] px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 ${
                  p === safePage
                    ? 'bg-crimson-600 text-white border border-crimson-500 shadow-[0_0_12px_rgba(186,26,26,0.45)]'
                    : 'bg-[#1a1a24] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          title="Next page"
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-[#1a1a24] text-gray-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors min-h-[34px] flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          aria-label="Last page"
          title="Last page"
          className="p-2 rounded-lg border border-white/[0.08] bg-[#1a1a24] text-gray-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
