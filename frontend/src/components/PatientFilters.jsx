import { ChevronDown, FilterX, Search } from 'lucide-react'

function PatientFilters({
  search,
  filters,
  options,
  optionsLoading,
  onSearchChange,
  onFilterChange,
  onClear,
  hasActiveFilters,
}) {
  const selectClassName =
    'h-[31px] w-full appearance-none rounded-md border border-slate-200 bg-white px-2 pr-7 text-[11px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50'

  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-100 p-2.5 sm:p-3 xl:flex-row xl:items-center">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">Search patients by name</span>
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          placeholder="Search patient name..."
          className="h-[31px] w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-[11px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 xl:w-[520px] xl:flex-none">
        <label className="relative">
          <span className="sr-only">Filter by ward</span>
          <select
            className={selectClassName}
            value={filters.ward}
            disabled={optionsLoading}
            onChange={(event) => onFilterChange('ward', event.target.value)}
          >
            <option value="">All wards</option>
            {options.wards.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown size={12} />
          </span>
        </label>

        <label className="relative">
          <span className="sr-only">Filter by department</span>
          <select
            className={selectClassName}
            value={filters.department}
            disabled={optionsLoading}
            onChange={(event) => onFilterChange('department', event.target.value)}
          >
            <option value="">All departments</option>
            {options.departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown size={12} />
          </span>
        </label>

        <label className="relative">
          <span className="sr-only">Filter by doctor</span>
          <select
            className={selectClassName}
            value={filters.doctor}
            disabled={optionsLoading}
            onChange={(event) => onFilterChange('doctor', event.target.value)}
          >
            <option value="">All doctors</option>
            {options.doctors.map((doctor) => (
              <option key={doctor.name} value={doctor.name}>
                {doctor.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown size={12} />
          </span>
        </label>
      </div>

      <button
        type="button"
        className="inline-flex h-[31px] flex-none items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 xl:px-1"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        <FilterX size={12} />
        Clear filters
      </button>
    </div>
  )
}

export default PatientFilters
