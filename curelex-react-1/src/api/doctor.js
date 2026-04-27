import apiClient from './client';
import API_ENDPOINTS from './endpoints';

export const doctorAPI = {
  getDoctorById: async (id) => {
    const data = await apiClient.get(API_ENDPOINTS.DOCTOR_BY_ID(id));
    return data.doctor;
  },

  getAllDoctors: async () => {
    const data = await apiClient.get(API_ENDPOINTS.ALL_DOCTORS);
    return data.doctors;
  },

  getApprovedDoctors: async () => {
    const data = await apiClient.get(API_ENDPOINTS.APPROVED_DOCTORS);
    return data.doctors;
  },

  updateProfilePhoto: async (id, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const data = await apiClient.put(API_ENDPOINTS.UPDATE_DOCTOR_PHOTO(id), formData);
    return data.photoUrl;
  },
};