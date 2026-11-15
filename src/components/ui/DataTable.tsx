import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 6,
  emptyMessage = 'No matching records found.',
  toolbarExtra,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  emptyMessage?: string;
  toolbarExtra?: React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchFilter) return data;
    const q = query.toLowerCase();
    return data.filter((r) => searchFilter(r, q));
  }, [data, query, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
      {(searchFilter || toolbarExtra) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchFilter && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#202820]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-white border border-[#202820]/15 rounded-xl text-sm text-[#202820] placeholder:text-[#202820]/40 focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30 focus:border-[#28A66A]"
              />
            </div>
          )}
          {toolbarExtra && <div className="flex items-center gap-2 flex-wrap">{toolbarExtra}</div>}
        </div>
      )}

      <div className="overflow-x-auto border border-[#202820]/10 rounded-xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#202820]/10 bg-[#F7F9F6]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-[#202820]/65 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202820]/8">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[#202820]/55">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F7F9F6]/70 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-[#202820] ${
                        col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-[#202820]/60">
          <span className="tabular-nums">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg border border-[#202820]/15 bg-white hover:bg-[#F7F9F6] disabled:opacity-40 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg border border-[#202820]/15 bg-white hover:bg-[#F7F9F6] disabled:opacity-40 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
