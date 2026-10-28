import api from '@/lib/api';
import {
  InstallerStatus,
  RequirementsResponse,
  InstallerEnvironmentPayload,
} from '@/types/installer';

export const installerService = {
  getStatus: async (): Promise<{ success: boolean; data: InstallerStatus }> => {
    const res = await api.get('/api/v1/install/status');
    return res.data;
  },

  getRequirements: async (): Promise<{ success: boolean; data: RequirementsResponse }> => {
    const res = await api.get('/api/v1/install/requirements');
    return res.data;
  },

  testDatabase: async (
    data: Partial<InstallerEnvironmentPayload>,
    setupToken?: string
  ): Promise<{ success: boolean; message: string }> => {
    const headers = setupToken ? { 'X-Installer-Token': setupToken } : undefined;
    const res = await api.post('/api/v1/install/test-database', data, { headers });
    return res.data;
  },

  saveEnvironment: async (
    data: InstallerEnvironmentPayload,
    setupToken?: string
  ): Promise<{ success: boolean; message: string }> => {
    const headers = setupToken ? { 'X-Installer-Token': setupToken } : undefined;
    const res = await api.post('/api/v1/install/environment', data, { headers });
    return res.data;
  },

  setupDatabase: async (
    setupToken?: string
  ): Promise<{ success: boolean; message: string; data?: { output: string } }> => {
    const headers = setupToken ? { 'X-Installer-Token': setupToken } : undefined;
    const res = await api.post('/api/v1/install/setup-database', {}, { headers });
    return res.data;
  },

  createSuperAdmin: async (
    data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    },
    setupToken?: string
  ): Promise<{ success: boolean; message: string }> => {
    const headers = setupToken ? { 'X-Installer-Token': setupToken } : undefined;
    const res = await api.post('/api/v1/install/create-admin', data, { headers });
    return res.data;
  },
};
