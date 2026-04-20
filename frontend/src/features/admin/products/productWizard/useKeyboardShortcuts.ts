/**
 * Hook personalizado para manejar atajos de teclado en el ProductWizard
 *
 * Atajos soportados:
 * - Ctrl+S: Guardar borrador
 * - Ctrl+P: Publicar producto
 * - Ctrl+D: Duplicar producto
 * - Ctrl+Shift+S: Guardar y crear otro
 * - Tab: Navegar entre campos validados
 */

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSaveDraft: () => void;
  onPublish: () => void;
  onDuplicate: () => void;
  onSaveAndCreateAnother: () => void;
  enabled?: boolean;
}

/**
 * Hook que maneja los atajos de teclado del wizard
 * Asegura accesibilidad y previene conflictos con atajos del navegador
 */
export function useKeyboardShortcuts({
  onSaveDraft,
  onPublish,
  onDuplicate,
  onSaveAndCreateAnother,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Verificar que el foco esté en el modal (no en un campo de entrada global)
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && target.getAttribute('type') !== 'submit');

      // Ctrl+S: Guardar borrador
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        onSaveDraft();
      }

      // Ctrl+P: Publicar producto
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        onPublish();
      }

      // Ctrl+D: Duplicar producto
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        onDuplicate();
      }

      // Ctrl+Shift+S: Guardar y crear otro
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        onSaveAndCreateAnother();
      }

      // Tab: Accesibilidad mejorada para navegación entre campos
      // Este es un comportamiento estándar que dejamos que el navegador maneje
      if (event.key === 'Tab' && isInInput) {
        // Permitir navegación normal con Tab dentro de inputs
        return;
      }
    },
    [enabled, onSaveDraft, onPublish, onDuplicate, onSaveAndCreateAnother],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
