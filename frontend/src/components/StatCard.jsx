function StatCard({ title, value, note, icon: Icon, isLoading }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-medium text-slate-500">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-5 w-12 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-0.5 text-[20px] font-semibold leading-5 tracking-tight text-slate-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Icon size={14} strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-1 text-[9px] text-slate-500">{note}</p>
    </section>
  )
}

export default StatCard
