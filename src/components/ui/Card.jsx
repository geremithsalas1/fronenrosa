export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
