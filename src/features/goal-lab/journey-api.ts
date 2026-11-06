import { apiClient } from '@/shared/api/client';
import type { Journey, JourneyPackage, SessionJourney } from './journey-types';
export const journeyApi = {
  list: async (memberId?: string): Promise<JourneyPackage[]> => (await apiClient.get(memberId ? `/members/${memberId}/journeys` : '/me/journeys')).data,
  get: async (id: string): Promise<Journey> => (await apiClient.get(`/pt-purchases/${id}/journey`)).data,
  initialize: async (id: string, body: object): Promise<Journey> => (await apiClient.post(`/pt-purchases/${id}/journey`, body)).data,
  session: async (id: string): Promise<SessionJourney> => (await apiClient.get(`/pt-bookings/${id}/journey`)).data,
  save: async (id: string, body: object): Promise<{ id: string }> => (await apiClient.post(`/pt-bookings/${id}/journey-result`, body)).data,
};
