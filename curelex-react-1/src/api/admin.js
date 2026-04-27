import apiClient from './client';
import API_ENDPOINTS from './endpoints';

export const adminAPI = {
  getPendingDoctors: async () => {
    const data = await apiClient.get(API_ENDPOINTS.PENDING_DOCTORS);
    return data;
  },

  approveDoctor: async (doctorId) => {
    const data = await apiClient.post(API_ENDPOINTS.APPROVE_DOCTOR(doctorId));
    return data;
  },

  rejectDoctor: async (doctorId) => {
    const data = await apiClient.post(API_ENDPOINTS.REJECT_DOCTOR(doctorId));
    return data;
  },
};