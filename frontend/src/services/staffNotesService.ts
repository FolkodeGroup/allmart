import type { StaffNote } from '../types/staffNote';
import { apiFetch } from '../utils/apiClient';

const BASE_URL = '/api/admin/staff-notes';

export const fetchStaffNotes = async (): Promise<StaffNote[]> => {
    return apiFetch<StaffNote[]>(BASE_URL);
};

export const createStaffNote = async (content: string): Promise<StaffNote> => {
    return apiFetch<StaffNote>(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
};

export const updateStaffNote = async (id: string, content: string): Promise<StaffNote> => {
    return apiFetch<StaffNote>(`${BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });
};

export const deleteStaffNote = async (id: string): Promise<void> => {
    await apiFetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
};