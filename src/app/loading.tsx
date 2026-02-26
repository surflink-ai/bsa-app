export default function Loading() {
  return (
    <div className="pb-20 px-4 pt-8 animate-pulse">
      <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="h-5 w-3/4 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
