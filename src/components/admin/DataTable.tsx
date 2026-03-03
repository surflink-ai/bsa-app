'use client'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({ columns, data, onEdit, onDelete, emptyMessage = 'No data yet.' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace", width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-24"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 text-right space-x-2">
                    {onEdit && (
                      <button onClick={() => onEdit(item)} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">Edit</button>
                    )}
                    {onDelete && (
                      <button onClick={() => { if (confirm('Delete this item?')) onDelete(item) }} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Delete</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
