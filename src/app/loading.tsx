export default function Loading() {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0A2540',
    }}>
      <div
        aria-label="Loading"
        role="status"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(43,165,160,0.25)', borderTopColor: '#2BA5A0',
          animation: 'bsa-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes bsa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
