import { authService, UpdateProfilePayload, UpdatePasswordPayload } from './authService';

export const profileService = {
  getProfile: () => authService.getUser(),
  updateProfile: (payload: UpdateProfilePayload) => authService.updateProfile(payload),
  updatePassword: (payload: UpdatePasswordPayload) => authService.updatePassword(payload),
};
