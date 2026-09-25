import api from './api.js';

/**
 * Profile API Service
 * Interacts with backend /api/profile endpoints with automated Bearer authorization.
 */
export const profileService = {
  /**
   * Fetches authenticated student's profile.
   */
  async getProfile() {
    const response = await api.get('/profile');
    return response.data?.profile || null;
  },

  /**
   * Updates student's profile fields.
   */
  async updateProfile(profileData) {
    const response = await api.put('/profile', profileData);
    return response.data?.profile || null;
  }
};

export default profileService;
