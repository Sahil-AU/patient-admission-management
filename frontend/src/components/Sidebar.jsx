import { BedDouble, LayoutDashboard, Plus, X } from 'lucide-react'

const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard, target: 'overview' },
  { label: 'Patients', icon: BedDouble, target: 'patients' },
]

function Sidebar({ isOpen, activeItem, onClose, onNavigate, onAddPatient }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          aria-label="Close navigation menu"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[200px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-slate-100 px-3">
          <a
            href="#overview"
            className="flex items-center gap-2"
            onClick={() => onNavigate('overview')}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-700 text-white">
              <span className="text-[10px] font-semibold tracking-tight">M+</span>
            </span>
            <span>
              <span className="block text-[12px] font-semibold tracking-tight text-slate-900">
                MediCare
              </span>
              <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Patient services
              </span>
            </span>
          </a>
          <button
            type="button"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation menu"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-2.5 pt-4">
          <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-0.5" aria-label="Main navigation">
            {navigationItems.map(({ label, icon: Icon, target }) => {
              const isActive = activeItem === target
              return (
                <button
                  key={target}
                  type="button"
                  className={`relative flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(target)}
                >
                  {isActive && (
                    <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-blue-700" />
                  )}
                  <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                </button>
              )
            })}
            <button
              type="button"
              className="flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              onClick={onAddPatient}
            >
              <Plus size={14} strokeWidth={1.8} />
              Add Patient
            </button>
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-2.5">
          <p className="text-[9px] font-medium text-slate-500">MediCare workspace</p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            Patient admissions overview
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
