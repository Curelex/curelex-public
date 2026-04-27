import apiClient from './client';
import API_ENDPOINTS from './endpoints';

export const authAPI = {
  // Patient
  patientLogin: async (email, password) => {
    const data = await apiClient.post(API_ENDPOINTS.PATIENT_LOGIN, JSON.stringify({ email, password }));
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  },

  patientRegister: async (userData) => {
    const data = await apiClient.post(API_ENDPOINTS.PATIENT_REGISTER, JSON.stringify(userData));
    return data;
  },

  // Doctor
  doctorLogin: async (email, password) => {
    const data = await apiClient.post(API_ENDPOINTS.DOCTOR_LOGIN, JSON.stringify({ email, password }));
    return {
      success: data.success,
      token: data.token,
      user: data.doctor,
    };
  },

  doctorRegister: async (userData) => {
    console.log(userData);
    console.log(JSON.stringify(userData));
    const data = await apiClient.post(API_ENDPOINTS.DOCTOR_REGISTER, JSON.stringify(userData));
    return data;
  },
};