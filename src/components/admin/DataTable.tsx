'use client'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  width?: string
  hideOnMobile?: boolean
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
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#0A2540]/30">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left pb-2.5 font-medium ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(10,37,64,0.2)',
                  paddingRight: '16px',
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th
                className="text-right pb-2.5 font-medium"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(10,37,64,0.2)',
                  width: '100px',
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)',
              }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`py-2.5 pr-4 text-[13px] text-[#0A2540]/70 ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="py-2.5 text-right">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-[12px] text-[#1478B5] hover:text-[#0A2540] transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {onEdit && onDelete && (
                    <span className="text-[#0A2540]/10 mx-1.5">|</span>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { if (confirm('Delete this item?')) onDelete(item) }}
                      className="text-[12px] text-[#DC2626]/50 hover:text-[#DC2626] transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
