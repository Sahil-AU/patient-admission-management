import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, UserPlus, X } from 'lucide-react'
import { getApiErrorMessage } from '../api/apiClient.js'
import {
  createPatient,
  fetchPatient,
  updatePatient,
} from '../api/dashboardApi.js'

const EMPTY_FORM = {
  name: '',
  age: '',
  gender: '',
  ward: '',
  department: '',
  doctor: '',
  admission_date: '',
}

const PATIENT_FIELDS = new Set([
  'name',
  'age',
  'gender',
  'ward',
  'department',
  'doctor',
  'admission_date',
])

const inputClassName =
  'h-[31px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50'

function getLocalDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function Field({ id, label, error, className = '', children }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-0.5 block text-[9px] font-semibold text-slate-700"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-0.5 text-[10px] leading-4 text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}

function AddPatientDialog({
  isOpen,
  patientId,
  onClose,
  onSaved,
  options,
  optionsLoading,
  optionsError,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPatient, setIsLoadingPatient] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const submittingRef = useRef(false)
  const isEditMode = Boolean(patientId)
  const today = getLocalDate()
  const doctors = Array.isArray(options.doctors) ? options.doctors : []
  const departmentDoctors = doctors.filter(
    (doctor) => doctor.department === form.department,
  )

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !submittingRef.current) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let isCurrent = true
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setSubmitError('')
    setLoadError('')

    if (!patientId) {
      setIsLoadingPatient(false)
      return () => {
        isCurrent = false
      }
    }

    setIsLoadingPatient(true)
    fetchPatient(patientId)
      .then((patient) => {
        if (isCurrent) {
          setForm({
            name: patient.name,
            age: String(patient.age),
            gender: patient.gender,
            ward: patient.ward,
            department: patient.department,
            doctor: patient.doctor,
            admission_date: patient.admission_date?.slice(0, 10) ?? '',
          })
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setLoadError(
            getApiErrorMessage(error, 'Could not load this patient. Please try again.'),
          )
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingPatient(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [isOpen, patientId, loadAttempt])

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === 'department' ? { doctor: '' } : {}),
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
      ...(field === 'department' ? { doctor: '' } : {}),
    }))
    setSubmitError('')
  }

  function validateForm() {
    const nextErrors = {}
    const normalizedName = form.name.trim().replace(/\s+/g, ' ')
    const trimmedAge = form.age.trim()

    if (!normalizedName) {
      nextErrors.name = 'Patient name is required.'
    } else if (!/^[\p{L} ]+$/u.test(normalizedName)) {
      nextErrors.name = 'Use letters and spaces only.'
    }

    if (!trimmedAge) {
      nextErrors.age = 'Age is required.'
    } else if (!/^-?\d+$/.test(trimmedAge)) {
      nextErrors.age = 'Enter age as a whole number.'
    } else if (Number(trimmedAge) < 0) {
      nextErrors.age = 'Age cannot be less than 0.'
    } else if (Number(trimmedAge) > 120) {
      nextErrors.age = 'Age cannot be greater than 120.'
    }

    if (!options.genders.includes(form.gender)) {
      nextErrors.gender = 'Select a gender.'
    }
    if (!options.wards.includes(form.ward)) {
      nextErrors.ward = 'Select a ward.'
    }
    if (!options.departments.includes(form.department)) {
      nextErrors.department = 'Select a department.'
    }

    const selectedDoctor = doctors.find(
      (doctor) => doctor.name === form.doctor,
    )
    if (!selectedDoctor) {
      nextErrors.doctor = 'Select a doctor.'
    } else if (selectedDoctor.department !== form.department) {
      nextErrors.doctor = 'Choose a doctor from the selected department.'
    }

    if (!form.admission_date) {
      nextErrors.admission_date = 'Admission date is required.'
    } else if (Number.isNaN(new Date(`${form.admission_date}T00:00:00`).getTime())) {
      nextErrors.admission_date = 'Enter a valid admission date.'
    } else if (form.admission_date > today) {
      nextErrors.admission_date = 'Admission date cannot be in the future.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return null
    }

    return {
      name: normalizedName,
      age: Number(trimmedAge),
      gender: form.gender,
      ward: form.ward,
      department: form.department,
      doctor: form.doctor,
      admission_date: form.admission_date,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current || optionsError || isLoadingPatient || loadError) {
      return
    }

    setSubmitError('')
    const patientData = validateForm()
    if (!patientData) {
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const savedPatient = isEditMode
        ? await updatePatient(patientId, patientData)
        : await createPatient(patientData)
      setForm({ ...EMPTY_FORM })
      setErrors({})
      onSaved(savedPatient, isEditMode ? 'updated' : 'created')
    } catch (error) {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail)) {
        const serverErrors = {}
        detail.forEach((item) => {
          const field = item.loc?.[item.loc.length - 1]
          if (PATIENT_FIELDS.has(field)) {
            serverErrors[field] = item.msg.replace(/^Value error,\s*/, '')
          }
        })
        setErrors((currentErrors) => ({ ...currentErrors, ...serverErrors }))
        setSubmitError(
          Object.keys(serverErrors).length > 0
            ? 'Please review the highlighted fields.'
            : detail.map((item) => item.msg).join(' '),
        )
      } else {
        setSubmitError(
          getApiErrorMessage(
            error,
            isEditMode
              ? 'Could not update the patient. Please try again.'
              : 'Could not add the patient. Please try again.',
          ),
        )
      }
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    if (isSubmitting) {
      return
    }
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setSubmitError('')
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2.5 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          handleCancel()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-dialog-title"
        className="max-h-[94vh] w-full max-w-[520px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-md shadow-slate-950/10"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-3 py-2.5 sm:px-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <UserPlus size={14} />
            </span>
            <div>
              <h2 id="patient-dialog-title" className="text-[13px] font-semibold text-slate-900">
                {isEditMode ? 'Edit patient' : 'Add patient'}
              </h2>
              <p className="mt-0.5 text-[9px] text-slate-500">
                {isEditMode
                  ? 'Update the patient admission details below.'
                  : 'Enter the admission details below.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close dialog"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X size={14} />
          </button>
        </div>

        <form className="p-3 sm:p-3.5" noValidate onSubmit={handleSubmit}>
          {optionsError && (
            <p
              role="alert"
              className="mb-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] text-rose-800"
            >
              Dropdown options are unavailable: {optionsError}
            </p>
          )}
          {submitError && (
            <p
              role="alert"
              className="mb-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] text-rose-800"
            >
              {submitError}
            </p>
          )}

          {isLoadingPatient ? (
            <div
              role="status"
              className="flex min-h-36 items-center justify-center gap-1.5 text-[10px] text-slate-500"
            >
              <LoaderCircle size={13} className="animate-spin text-blue-600" />
              Loading patient details...
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-[10px] text-rose-800">
              <p>{loadError}</p>
              <button
                type="button"
                className="mt-2 font-semibold underline underline-offset-2"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              >
                Retry loading patient
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2">
            <Field
              id="patient-name"
              label="Patient name"
              error={errors.name}
              className="sm:col-span-2"
            >
              <input
                id="patient-name"
                name="name"
                type="text"
                autoComplete="off"
                value={form.name}
                maxLength={120}
                placeholder="Enter full name"
                className={inputClassName}
                disabled={isLoadingPatient || isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'patient-name-error' : undefined}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </Field>

            <Field id="patient-age" label="Age" error={errors.age}>
              <input
                id="patient-age"
                name="age"
                type="number"
                min="0"
                max="120"
                step="1"
                inputMode="numeric"
                value={form.age}
                placeholder="Age in years"
                className={inputClassName}
                disabled={isLoadingPatient || isSubmitting}
                aria-invalid={Boolean(errors.age)}
                aria-describedby={errors.age ? 'patient-age-error' : undefined}
                onChange={(event) => updateField('age', event.target.value)}
              />
            </Field>

            <Field id="patient-gender" label="Gender" error={errors.gender}>
              <select
                id="patient-gender"
                name="gender"
                value={form.gender}
                disabled={optionsLoading || isSubmitting}
                className={inputClassName}
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? 'patient-gender-error' : undefined}
                onChange={(event) => updateField('gender', event.target.value)}
              >
                <option value="">Select gender</option>
                {options.genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="patient-ward" label="Ward" error={errors.ward}>
              <select
                id="patient-ward"
                name="ward"
                value={form.ward}
                disabled={optionsLoading || isSubmitting}
                className={inputClassName}
                aria-invalid={Boolean(errors.ward)}
                aria-describedby={errors.ward ? 'patient-ward-error' : undefined}
                onChange={(event) => updateField('ward', event.target.value)}
              >
                <option value="">Select ward</option>
                {options.wards.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="patient-department"
              label="Department"
              error={errors.department}
            >
              <select
                id="patient-department"
                name="department"
                value={form.department}
                disabled={optionsLoading || isSubmitting}
                className={inputClassName}
                aria-invalid={Boolean(errors.department)}
                aria-describedby={
                  errors.department ? 'patient-department-error' : undefined
                }
                onChange={(event) => updateField('department', event.target.value)}
              >
                <option value="">Select department</option>
                {options.departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="patient-doctor" label="Doctor" error={errors.doctor}>
              <select
                id="patient-doctor"
                name="doctor"
                value={form.doctor}
                disabled={
                  optionsLoading || isSubmitting || !form.department
                }
                className={inputClassName}
                aria-invalid={Boolean(errors.doctor)}
                aria-describedby={errors.doctor ? 'patient-doctor-error' : undefined}
                onChange={(event) => updateField('doctor', event.target.value)}
              >
                <option value="">
                  {form.department ? 'Select doctor' : 'Select department first'}
                </option>
                {departmentDoctors.map((doctor) => (
                  <option key={doctor.name} value={doctor.name}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="patient-admission-date"
              label="Admission date"
              error={errors.admission_date}
            >
              <input
                id="patient-admission-date"
                name="admission_date"
                type="date"
                max={today}
                value={form.admission_date}
                className={inputClassName}
                disabled={isLoadingPatient || isSubmitting}
                aria-invalid={Boolean(errors.admission_date)}
                aria-describedby={
                  errors.admission_date ? 'patient-admission-date-error' : undefined
                }
                onChange={(event) =>
                  updateField('admission_date', event.target.value)
                }
              />
            </Field>
          </div>
          )}

          <div className="mt-3 flex flex-col-reverse gap-1.5 border-t border-slate-100 pt-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-[30px] rounded-md border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-[30px] items-center justify-center gap-1 rounded-md bg-blue-700 px-3 text-[10px] font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                isSubmitting ||
                isLoadingPatient ||
                Boolean(loadError) ||
                optionsLoading ||
                Boolean(optionsError)
              }
            >
              {isSubmitting && <LoaderCircle size={12} className="animate-spin" />}
              {isSubmitting
                ? isEditMode
                  ? 'Saving changes...'
                  : 'Adding patient...'
                : isEditMode
                  ? 'Save changes'
                  : 'Add Patient'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AddPatientDialog
