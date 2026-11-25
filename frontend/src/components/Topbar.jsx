import { Menu } from 'lucide-react'

function Topbar({ onMenuClick }) {
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
  const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-20 flex h-[48px] items-center justify-between border-b border-slate-200 bg-white/95 px-2.5 backdrop-blur sm:px-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          className="rounded-md p-1 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu size={14} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-900">
            Patient Management
          </p>
          <p className="text-[9px] text-slate-500 sm:hidden">{shortDate}</p>
          <p className="hidden text-[9px] text-slate-500 sm:block md:hidden">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="hidden text-[9px] font-medium text-slate-500 md:block">{today}</p>
        <span className="hidden h-6 w-px bg-slate-200 md:block" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-semibold text-blue-800 ring-2 ring-white">
            CT
          </span>
          <div className="hidden sm:block">
            <p className="text-[9px] font-semibold text-slate-800">Care team</p>
            <p className="text-[9px] text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
