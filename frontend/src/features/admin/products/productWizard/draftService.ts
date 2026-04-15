/**
 * Servicio para gestionar borradores de productos en el wizard
 * Usa localStorage para persistencia local
 */

import type { WizardDraft, WizardProduct } from './types';

const STORAGE_KEY = 'product_wizard_drafts';
const CURRENT_DRAFT_KEY = 'product_wizard_current';

export class DraftService {
  /**
   * Obtiene el borrador actual en sesión
   */
  static getCurrentDraft(): Partial<WizardProduct> | null {
    try {
      const draft = sessionStorage.getItem(CURRENT_DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  }

  /**
   * Guarda el borrador en sesión
   */
  static saveCurrentDraft(data: Partial<WizardProduct>): void {
    try {
      sessionStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(data));
    } catch {
      console.error('Error saving draft to sessionStorage');
    }
  }

  /**
   * Limpia el borrador de sesión
   */
  static clearCurrentDraft(): void {
    try {
      sessionStorage.removeItem(CURRENT_DRAFT_KEY);
    } catch {
      console.error('Error clearing draft from sessionStorage');
    }
  }

  /**
   * Guarda un borrador en localStorage (persistencia a largo plazo)
   */
  static savePersistentDraft(data: Partial<WizardProduct>): string {
    try {
      const drafts = this.getAllDrafts();
      const id = data.id || `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const draft: WizardDraft = {
        id,
        data,
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
        updatedAt: Date.now(),
        status: 'draft',
      };

      drafts[id] = draft;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      return id;
    } catch {
      console.error('Error saving persistent draft');
      return '';
    }
  }

  /**
   * Obtiene todos los borradores guardados
   */
  static getAllDrafts(): Record<string, WizardDraft> {
    try {
      const drafts = localStorage.getItem(STORAGE_KEY);
      return drafts ? JSON.parse(drafts) : {};
    } catch {
      return {};
    }
  }

  /**
   * Obtiene un borrador específico
   */
  static getDraft(id: string): WizardDraft | null {
    try {
      const drafts = this.getAllDrafts();
      return drafts[id] || null;
    } catch {
      return null;
    }
  }

  /**
   * Elimina un borrador
   */
  static deleteDraft(id: string): void {
    try {
      const drafts = this.getAllDrafts();
      delete drafts[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      console.error('Error deleting draft');
    }
  }

  /**
   * Marca un borrador como publicado
   */
  static markAsPublished(id: string): void {
    try {
      const drafts = this.getAllDrafts();
      if (drafts[id]) {
        drafts[id].status = 'published';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      }
    } catch {
      console.error('Error marking draft as published');
    }
  }

  /**
   * Limpia todos los borradores
   */
  static clearAllDrafts(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(CURRENT_DRAFT_KEY);
    } catch {
      console.error('Error clearing all drafts');
    }
  }
}
