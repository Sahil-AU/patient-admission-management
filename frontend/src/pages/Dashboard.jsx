import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  Plus,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react'
import AddPatientDialog from '../components/AddPatientDialog.jsx'
import PatientFilters from '../components/PatientFilters.jsx'
import PatientTable from '../components/PatientTable.jsx'
import Sidebar from '../components/Sidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import Topbar from '../components/Topbar.jsx'
import {
  deletePatient,
  dischargePatient,
  fetchDashboardStats,
  fetchPatientOptions,
  fetchPatients,
} from '../api/dashboardApi.js'
import { getApiErrorMessage } from '../api/apiClient.js'

const PAGE_SIZE = 10
const EMPTY_OPTIONS = {
  genders: [],
  wards: [],
  departments: [],
  doctors: [],
}
const EMPTY_FILTERS = {
  ward: '',
  department: '',
  doctor: '',
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const [options, setOptions] = useState(EMPTY_OPTIONS)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [patients, setPatients] = useState([])
  const [totalPatients, setTotalPatients] = useState(0)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsError, setPatientsError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeNavigation, setActiveNavigation] = useState('overview')
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [patientDialogId, setPatientDialogId] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    let isCurrent = true

    setStatsLoading(true)
    setStatsError('')
    fetchDashboardStats()
      .then((data) => {
        if (isCurrent) {
          setStats(data)
          setStatsError('')
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setStatsError(getApiErrorMessage(error, 'Could not load dashboard statistics.'))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setStatsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [statsRefreshKey])

  useEffect(() => {
    let isCurrent = true

    fetchPatientOptions()
      .then((data) => {
        if (isCurrent) {
          setOptions(data)
          setOptionsError('')
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setOptionsError(getApiErrorMessage(error, 'Could not load filter options.'))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setOptionsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!notification) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setNotification(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [notification])

  useEffect(() => {
    if (!pendingAction) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isActionSubmitting) {
        setPendingAction(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pendingAction, isActionSubmitting])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    let isCurrent = true
    const params = {
      page,
      page_size: PAGE_SIZE,
    }

    if (debouncedSearch) {
      params.search = debouncedSearch
    }
    if (filters.ward) {
      params.ward = filters.ward
    }
    if (filters.department) {
      params.department = filters.department
    }
    if (filters.doctor) {
      params.doctor = filters.doctor
    }

    setPatientsLoading(true)
    setPatientsError('')

    fetchPatients(params)
      .then((data) => {
        if (isCurrent) {
          setPatients(data.items)
          setTotalPatients(data.total)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setPatientsError(getApiErrorMessage(error, 'Could not load patients.'))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setPatientsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [page, debouncedSearch, filters, refreshKey])

  const closePatientDialog = useCallback(() => {
    setIsPatientDialogOpen(false)
    setPatientDialogId(null)
  }, [])

  function navigateTo(target) {
    setActiveNavigation(target)
    setIsSidebarOpen(false)
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
  }

  function updateFilter(filterName, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterName]: value,
    }))
    setPage(1)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setFilters({ ...EMPTY_FILTERS })
    setPage(1)
  }

  function handlePatientSaved(patient, action) {
    closePatientDialog()
    setNotification({
      type: 'success',
      message:
        action === 'created'
          ? `Patient ${patient.patient_id} added successfully.`
          : `Changes to ${patient.name} saved successfully.`,
    })
    if (action === 'created') {
      setSearch('')
      setDebouncedSearch('')
      setFilters({ ...EMPTY_FILTERS })
      setPage(1)
    }
    setRefreshKey((currentKey) => currentKey + 1)
    setStatsRefreshKey((currentKey) => currentKey + 1)
    window.setTimeout(() => {
      document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function openAddPatientDialog() {
    setPatientDialogId(null)
    setIsPatientDialogOpen(true)
  }

  function openEditPatientDialog(patient) {
    setPatientDialogId(patient._id)
    setIsPatientDialogOpen(true)
  }

  async function confirmPatientAction() {
    if (!pendingAction || isActionSubmitting) {
      return
    }

    setIsActionSubmitting(true)
    try {
      if (pendingAction.type === 'delete') {
        await deletePatient(pendingAction.patient._id)
      } else {
        await dischargePatient(pendingAction.patient._id)
      }

      const actionLabel =
        pendingAction.type === 'delete' ? 'deleted' : 'discharged'
      setNotification({
        type: 'success',
        message: `${pendingAction.patient.name} was ${actionLabel} successfully.`,
      })
      setPendingAction(null)
      if (
        pendingAction.type === 'delete' &&
        page > 1 &&
        patients.length === 1
      ) {
        setPage((currentPage) => currentPage - 1)
      }
      setRefreshKey((currentKey) => currentKey + 1)
      setStatsRefreshKey((currentKey) => currentKey + 1)
    } catch (error) {
      const verb = pendingAction.type === 'delete' ? 'delete' : 'discharge'
      setNotification({
        type: 'error',
        message: getApiErrorMessage(
          error,
          `Could not ${verb} this patient. Please try again.`,
        ),
      })
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const hasActiveFilters = Boolean(
    search.trim() || filters.ward || filters.department || filters.doctor,
  )

  const statCards = [
    {
      title: 'Total patients',
      value: stats?.total_patients,
      note: 'All patient records',
      icon: UsersRound,
    },
    {
      title: 'Currently admitted',
      value: stats?.admitted_patients,
      note: 'Patients in care',
      icon: UserRoundCheck,
    },
    {
      title: 'Discharged',
      value: stats?.discharged_patients,
      note: 'Completed admissions',
      icon: ClipboardList,
    },
    {
      title: "Today's admissions",
      value: stats?.today_admissions,
      note: 'Admissions recorded today',
      icon: CalendarDays,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800">
      <Sidebar
        isOpen={isSidebarOpen}
        activeItem={activeNavigation}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={navigateTo}
        onAddPatient={() => {
          setIsSidebarOpen(false)
          openAddPatientDialog()
        }}
      />

      <div className="min-h-screen lg:pl-[200px]">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="mx-auto max-w-[1600px] px-2.5 py-3 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
          <section
            id="overview"
            className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="mb-0.5 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-blue-700">
                <Activity size={11} />
                Care overview
              </div>
              <h1 className="text-[16px] font-semibold tracking-tight text-slate-900">
                Dashboard
              </h1>
              <p className="mt-0.5 text-[10px] text-slate-500">
                A clear view of patient admissions and care activity.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-[30px] items-center justify-center gap-1 self-start rounded-md bg-blue-700 px-2.5 text-[10px] font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-blue-600 sm:self-auto"
              onClick={openAddPatientDialog}
            >
              <Plus size={12} />
              Add Patient
            </button>
          </section>

          {statsError && (
            <div
              role="alert"
              className="mb-2.5 flex flex-col gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] text-rose-800 sm:flex-row sm:items-center"
            >
              <span className="font-semibold">Statistics unavailable.</span>
              <span>{statsError}</span>
            </div>
          )}

          <section
            aria-label="Patient statistics"
            className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
          >
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                {...card}
                isLoading={statsLoading}
                value={statsError ? '—' : card.value ?? '—'}
              />
            ))}
          </section>

          {optionsError && (
            <div
              role="alert"
              className="mb-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] text-amber-900"
            >
              Filter options could not be loaded: {optionsError}
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-0.5 px-2.5 pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <div>
                <h2 className="text-[13px] font-semibold text-slate-900">Admissions</h2>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  Search and filter the patient directory
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 sm:mt-0">
                <span className="h-1 w-1 rounded-full bg-blue-600" />
                Live records
              </span>
            </div>

            <PatientFilters
              search={search}
              filters={filters}
              options={options}
              optionsLoading={optionsLoading}
              onSearchChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              onFilterChange={updateFilter}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <PatientTable
              patients={patients}
              total={totalPatients}
              page={page}
              pageSize={PAGE_SIZE}
              isLoading={patientsLoading}
              error={patientsError}
              onRetry={() => setRefreshKey((currentKey) => currentKey + 1)}
              onPageChange={setPage}
              hasActiveFilters={hasActiveFilters}
              onEditPatient={openEditPatientDialog}
              onDeletePatient={(patient) =>
                setPendingAction({ type: 'delete', patient })
              }
              onDischargePatient={(patient) =>
                setPendingAction({ type: 'discharge', patient })
              }
            />
          </section>

          <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400">
            <Activity size={11} />
            Patient information is provided by the hospital management API.
          </p>
        </main>
      </div>

      <AddPatientDialog
        isOpen={isPatientDialogOpen}
        patientId={patientDialogId}
        onClose={closePatientDialog}
        onSaved={handlePatientSaved}
        options={options}
        optionsLoading={optionsLoading}
        optionsError={optionsError}
      />
      {pendingAction && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/40 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isActionSubmitting) {
              setPendingAction(null)
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="patient-action-title"
            aria-describedby="patient-action-description"
            className="w-full max-w-[340px] rounded-lg border border-slate-200 bg-white p-3 shadow-md shadow-slate-950/10 sm:p-3.5"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${
                  pendingAction.type === 'delete'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <AlertTriangle size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="patient-action-title"
                  className="text-[13px] font-semibold text-slate-900"
                >
                  {pendingAction.type === 'delete'
                    ? 'Delete patient?'
                    : 'Discharge patient?'}
                </h2>
                <p
                  id="patient-action-description"
                  className="mt-1 break-words text-[10px] leading-4 text-slate-600"
                >
                  {pendingAction.type === 'delete'
                    ? `Delete ${pendingAction.patient.name}? This permanently removes the patient record.`
                    : `Confirm that ${pendingAction.patient.name} is ready to be discharged.`}
                </p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close confirmation"
                onClick={() => setPendingAction(null)}
                disabled={isActionSubmitting}
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-3 flex flex-col-reverse gap-1.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="h-[28px] rounded-md border border-slate-200 px-2.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPendingAction(null)}
                disabled={isActionSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex h-[28px] items-center justify-center gap-1 rounded-md px-2.5 text-[10px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingAction.type === 'delete'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-blue-700 hover:bg-blue-800'
                }`}
                onClick={confirmPatientAction}
                disabled={isActionSubmitting}
              >
                {isActionSubmitting && (
                  <LoaderCircle size={11} className="animate-spin" />
                )}
                {pendingAction.type === 'delete'
                  ? 'Delete patient'
                  : 'Discharge patient'}
              </button>
            </div>
          </section>
        </div>
      )}
      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          className={`fixed right-2.5 top-[56px] z-[60] max-w-[calc(100vw-1.25rem)] rounded-md border bg-white px-2.5 py-1.5 text-[10px] font-medium shadow-sm ${
            notification.type === 'error'
              ? 'border-rose-200 text-rose-800'
              : 'border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default Dashboard
