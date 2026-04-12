import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

export function Table<T>({ columns, data, keyField, emptyMessage = 'No records found.' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-earth-100">
      <table className="w-full text-sm">
        <thead className="bg-earth-50 border-b border-earth-100">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left font-semibold text-earth-700 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-earth-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-earth-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={String(row[keyField])} className="hover:bg-earth-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-earth-800 ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
