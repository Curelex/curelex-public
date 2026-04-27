const API_ENDPOINTS = {
  // Auth
  PATIENT_LOGIN: '/users/login',
  PATIENT_REGISTER: '/users/register',
  DOCTOR_LOGIN: '/doctors/login',
  DOCTOR_REGISTER: '/doctors/register',
  
  // Doctor
  DOCTOR_BY_ID: (id) => `/doctors/${id}`,
  ALL_DOCTORS: '/doctors/all',
  APPROVED_DOCTORS: '/doctors/all/approved',
  UPDATE_DOCTOR_PHOTO: (id) => `/doctors/${id}/photo`,
  
  // Admin
  PENDING_DOCTORS: '/admin/pending-doctors',
  APPROVE_DOCTOR: (id) => `/admin/approve/${id}`,
  REJECT_DOCTOR: (id) => `/admin/reject/${id}`,
  
  // Appointments
  BOOK_APPOINTMENT: '/appointments/book',
  PATIENT_APPOINTMENTS: (id) => `/appointments/patient/${id}`,
  DOCTOR_APPOINTMENTS: (id) => `/appointments/doctor/${id}`,
  PENDING_APPOINTMENTS: (doctorId) => `/appointments/doctor/${doctorId}/pending`,
  APPROVE_APPOINTMENT: (id) => `/appointments/${id}/approve`,
  UPDATE_APPOINTMENT_STATUS: (id) => `/appointments/status/${id}`,
  DOCTOR_STATS: (doctorId) => `/appointments/doctor/${doctorId}/stats`,
  
  // Prescriptions
  ADD_PRESCRIPTION: '/prescriptions/add',
  PATIENT_PRESCRIPTIONS: (id) => `/prescriptions/patient/${id}`,
  DOCTOR_PRESCRIPTIONS: (id) => `/prescriptions/doctor/${id}`,
  
  // Medicines
  ADD_MEDICINE: '/medicines/add',
  ALL_MEDICINES: '/medicines/all',
  
  // Dashboard
  PATIENT_DASHBOARD: (id) => `/dashboard/patient/${id}`,
  DOCTOR_DASHBOARD: (id) => `/dashboard/doctor/${id}`,
};

export default API_ENDPOINTS;