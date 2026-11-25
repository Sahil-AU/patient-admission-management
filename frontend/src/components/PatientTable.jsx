import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  UsersRound,
} from 'lucide-react'

function formatAdmissionDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function PatientTable({
  patients,
  total,
  page,
  pageSize,
  isLoading,
  error,
  onRetry,
  onPageChange,
  hasActiveFilters,
  onEditPatient,
  onDeletePatient,
  onDischargePatient,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)

  return (
    <section
      id="patients"
      className="overflow-hidden rounded-md border border-slate-200 bg-white"
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-900">Patient directory</h2>
          <p className="mt-0.5 text-[9px] text-slate-500">
            Patient admissions and care assignments
          </p>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-500 sm:mt-0">
          {isLoading && (
            <LoaderCircle size={12} className="animate-spin text-blue-600" />
          )}
          <span>{isLoading ? 'Updating results' : `${total.toLocaleString()} patients`}</span>
        </div>
      </div>

      {error && (
        <div
          className="mx-2.5 mt-2 flex flex-col gap-1.5 rounded-md border border-rose-200 bg-rose-50 p-2 text-[10px] text-rose-800 sm:mx-3 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span className="flex items-start gap-2">
            <AlertCircle size={12} className="mt-0.5 flex-none" />
            {error}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 self-start text-[10px] font-semibold text-rose-800 hover:text-rose-950 sm:self-auto"
            onClick={onRetry}
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && patients.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center px-4 py-5 text-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UsersRound size={14} />
          </span>
          <h3 className="mt-2 text-[12px] font-semibold text-slate-800">
            {hasActiveFilters ? 'No matching patients' : 'No patients yet'}
          </h3>
          <p className="mt-1 max-w-sm text-[9px] leading-4 text-slate-500">
            {hasActiveFilters
              ? 'Try adjusting your search or clearing one or more filters.'
              : 'Patient records will appear here when they are added to the system.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 text-[9px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                  <th className="px-2.5 py-1.5 sm:px-3">Patient</th>
                  <th className="px-2 py-1.5">Age / Gender</th>
                  <th className="px-2 py-1.5">Ward</th>
                  <th className="px-2 py-1.5">Department</th>
                  <th className="px-2 py-1.5">Doctor</th>
                  <th className="px-2 py-1.5">Admission date</th>
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && patients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-7 text-center text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <LoaderCircle size={13} className="animate-spin text-blue-600" />
                        Loading patients...
                      </span>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-2.5 py-1 sm:px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-[9px] font-semibold text-blue-800">
                            {patient.name
                              .split(' ')
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                          <span>
                            <span className="block text-[10px] font-semibold text-slate-800">
                              {patient.name}
                            </span>
                            <span className="mt-px block text-[9px] text-slate-500">
                              {patient.patient_id}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-[10px] text-slate-600">
                        {patient.age} yrs <span className="mx-1 text-slate-300">·</span>{' '}
                        {patient.gender}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-[10px] font-medium text-slate-700">
                        {patient.ward}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-[10px] text-slate-600">
                        {patient.department}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-[10px] text-slate-600">
                        {patient.doctor}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-[10px] text-slate-600">
                        {formatAdmissionDate(patient.admission_date)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-semibold ${
                            patient.status === 'Admitted'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                              : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1 w-1 rounded-full ${
                              patient.status === 'Admitted'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {patient.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            className="inline-flex h-[28px] w-[28px] flex-none items-center justify-center rounded text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                            aria-label={`Edit ${patient.name}`}
                            title="Edit patient"
                            onClick={() => onEditPatient(patient)}
                          >
                            <Pencil size={12} />
                          </button>
                          {patient.status === 'Admitted' && (
                            <button
                              type="button"
                              className="inline-flex h-[28px] w-[28px] flex-none items-center justify-center rounded text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
                              aria-label={`Discharge ${patient.name}`}
                              title="Discharge patient"
                              onClick={() => onDischargePatient(patient)}
                            >
                              <LogOut size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="inline-flex h-[28px] w-[28px] flex-none items-center justify-center rounded text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600"
                            aria-label={`Delete ${patient.name}`}
                            title="Delete patient"
                            onClick={() => onDeletePatient(patient)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-slate-100 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
            <p className="text-[9px] text-slate-500">
              Showing <span className="font-semibold text-slate-700">{firstItem}–{lastItem}</span>{' '}
              of <span className="font-semibold text-slate-700">{total}</span>
            </p>
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                className="inline-flex h-[28px] items-center gap-1 rounded-md border border-slate-200 px-1.5 text-[9px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft size={12} />
                Previous
              </button>
              <span className="px-1 text-[9px] text-slate-500">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                className="inline-flex h-[28px] items-center gap-1 rounded-md border border-slate-200 px-1.5 text-[9px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount || isLoading}
              >
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default PatientTable
