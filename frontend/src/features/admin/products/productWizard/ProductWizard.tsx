/**
 * ProductWizard Component
 *
 * Modal wizard para crear productos con soporte para:
 * - Atajos de teclado (Ctrl+S, Ctrl+P, Ctrl+D, Ctrl+Shift+S)
 * - Barra flotante de acciones rápidas
 * - Opción "Guardar y crear otro"
 * - Auto-save a sessionStorage
 * - Persistencia de borradores
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Save, Loader } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2VariantsImages } from './Step2VariantsImages';
import { Step3ReviewPublish } from './Step3ReviewPublish';
import { DraftService } from './draftService';
import { useReadyToPublish } from './ReadyToPublishChecklist';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { QuickActionsToolbar } from './QuickActionsToolbar';
import styles from './ProductWizard.module.css';
import type { WizardProduct } from './types';

interface ProductWizardProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string }>;
  onPublish: (product: WizardProduct) => Promise<void>;
  existingDraftId?: string;
}

export function ProductWizard({
  open,
  onClose,
  categories,
  onPublish,
  existingDraftId,
}: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<WizardProduct>>({
    variants: [],
    images: [],
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaveAndCreateAnother, setIsSaveAndCreateAnother] = useState(false);
  const step1Ref = useRef<{ validate: () => boolean }>(null);
  const step2Ref = useRef<{ validate: () => boolean }>(null);


  // Hook para validar si el producto está listo para publicar
  const { isReady } = useReadyToPublish(data);

  // Cargar borrador si estamos editando
  useEffect(() => {
    if (open) {
      if (existingDraftId) {
        const draft = DraftService.getDraft(existingDraftId);
        if (draft) {
          setData(draft.data);
        }
      } else {
        const currentDraft = DraftService.getCurrentDraft();
        if (currentDraft) {
          setData(currentDraft);
        }
      }
    }
  }, [open, existingDraftId]);

  // Auto-save a sessionStorage cuando los datos cambian
  useEffect(() => {
    if (open) {
      DraftService.saveCurrentDraft(data);
    }
  }, [data, open]);

  const handleDataChange = useCallback((newData: Partial<WizardProduct>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    if (currentStep === 1) {
      return step1Ref.current?.validate() ?? true;
    } else if (currentStep === 2) {
      return step2Ref.current?.validate() ?? true;
    }
    return true;
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  }, [validateCurrentStep]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /**
   * Guarda el borrador actual en localStorage
   * Atajo: Ctrl+S
   */
  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      DraftService.savePersistentDraft(data);
      toast.success('Borrador guardado correctamente');
    } catch (err) {
      console.error('Error al guardar el borrador', err);
      toast.error('Error al guardar el borrador');
    } finally {
      setIsSavingDraft(false);
    }
  }, [data]);

  /**
   * Duplica el producto actual y reinicia el formulario
   * Útil para crear productos similares rápidamente
   * Atajo: Ctrl+D
   */
  const handleDuplicate = useCallback(() => {
    if (!data.name) {
      toast.error('Por favor completa el nombre del producto antes de duplicar');
      return;
    }

    // Crear una copia sin el ID para que sea un nuevo producto
    const duplicatedData = {
      ...data,
      id: undefined,
      createdAt: undefined,
    };

    setData(duplicatedData);
    setCurrentStep(1);
    DraftService.saveCurrentDraft(duplicatedData);
    toast.success('Producto duplicado - puedes modificar los detalles');
  }, [data]);

  /**
   * Publica el producto actual
   * Si isReset es true, reinicia el formulario para crear otro
   * Atajo: Ctrl+P o Ctrl+Shift+S
   */
  const handlePublish = useCallback(
    async (isReset = false) => {
      // Validaciones finales
      if (!data.name || !data.categoryId || !data.description) {
        toast.error('Por favor completa la información básica');
        setCurrentStep(1);
        return;
      }

      if (!data.variants || data.variants.length === 0) {
        toast.error('Por favor agrega al menos una variante');
        setCurrentStep(2);
        return;
      }

      if (!data.images || data.images.filter((img) => img).length === 0) {
        toast.error('Por favor carga al menos una imagen');
        setCurrentStep(2);
        return;
      }

      // Validar SKU principal
      let sku = data.sku;
      if (!sku && data.variants && data.variants.length > 0) {
        sku = data.variants[0].sku;
      }
      if (!sku || sku.trim() === '') {
        toast.error('Por favor completa el SKU del producto o de la primera variante');
        setCurrentStep(2);
        return;
      }

      setIsPublishing(true);
      try {
        // Preparar datos del producto
        const productData: WizardProduct = {
          name: data.name || '',
          description: data.description || '',
          categoryId: data.categoryId || '',
          variants: data.variants || [],
          images: data.images.filter((img) => img) || [],
          price: data.price || (data.variants?.[0]?.price || 0),
          stock: data.stock || (data.variants?.reduce((sum, v) => sum + v.stock, 0) || 0),
          inStock: true,
          sku,
          shortDescription: data.shortDescription,
          tags: data.tags,
        };

        await onPublish(productData);

        // Limpiar
        DraftService.clearCurrentDraft();
        toast.success('¡Producto publicado correctamente!');

        if (isReset) {
          // Reiniciar para crear otro
          setData({ variants: [], images: [] });
          setCurrentStep(1);
          toast.success('Iniciando nuevo producto...');
        } else {
          onClose();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al publicar';
        toast.error(message);
      } finally {
        setIsPublishing(false);
      }
    },
    [data, onPublish, onClose],
  );

  /**
   * Guarda y crea otro producto
   * Atajo: Ctrl+Shift+S
   */
  const handleSaveAndCreateAnother = useCallback(async () => {
    setIsSaveAndCreateAnother(true);
    try {
      await handlePublish(true);
    } finally {
      setIsSaveAndCreateAnother(false);
    }
  }, [handlePublish]);

  /**
   * Navega a la vista previa del producto
   * Atajo: Sin atajo directo (usa botón en toolbar)
   */
  const handlePreview = useCallback(() => {
    if (!data.name || !data.description) {
      toast.error('Por favor completa los detalles básicos para ver preview');
      setCurrentStep(1);
      return;
    }
    // Navegar a paso 3 para ver preview
    setCurrentStep(3);
    toast.success('Viendo preview del producto');
  }, [data]);

  /**
   * Cierra el wizard, pidiendo guardar borrador si hay cambios
   */
  const handleClose = useCallback(() => {
    if (Object.keys(data).length > 0 && (data.name || data.variants?.length || data.images?.length)) {
      if (confirm('¿Deseas guardar este borrador antes de salir?')) {
        handleSaveDraft();
      }
    }
    DraftService.clearCurrentDraft();
    setCurrentStep(1);
    setData({ variants: [], images: [] });
    onClose();
  }, [data, onClose, handleSaveDraft]);

  // Activar atajos de teclado
  useKeyboardShortcuts({
    onSaveDraft: handleSaveDraft,
    onPublish: () => handlePublish(false),
    onDuplicate: handleDuplicate,
    onSaveAndCreateAnother: handleSaveAndCreateAnother,
    enabled: open,
  });

  const stepTitles = [
    'Información Básica',
    'Variantes e Imágenes',
    'Revisar y Publicar',
  ];

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 400 : -400,
      opacity: 0,
    }),
  };

  const modalActions = (
    <div className={styles.actions}>
      <button
        onClick={handleSaveDraft}
        disabled={isPublishing || isSavingDraft}
        className={styles.btnDraft}
        title="Guardar como borrador (Ctrl+S)"
      >
        {isSavingDraft ? (
          <>
            <Loader size={16} className={styles.spinning} /> Guardando...
          </>
        ) : (
          <>
            <Save size={16} /> Guardar Borrador
          </>
        )}
      </button>

      <div className={styles.navButtons}>
        {currentStep > 1 && (
          <button
            onClick={handlePrev}
            disabled={isPublishing}
            className={styles.btnSecondary}
          >
            <ChevronLeft size={18} /> Atrás
          </button>
        )}

        {currentStep < 3 && (
          <button
            onClick={handleNext}
            disabled={isPublishing}
            className={styles.btnPrimary}
          >
            Siguiente <ChevronRight size={18} />
          </button>
        )}

        {currentStep === 3 && (
          <>
            <button
              onClick={handleSaveAndCreateAnother}
              disabled={isPublishing || isSaveAndCreateAnother}
              className={styles.btnSecondary}
              title="Guardar y crear otro (Ctrl+Shift+S)"
            >
              {isSaveAndCreateAnother ? (
                <>
                  <Loader size={16} className={styles.spinning} /> Procesando...
                </>
              ) : (
                '↻ Guardar y Crear Otro'
              )}
            </button>

            <button
              onClick={() => handlePublish(false)}
              disabled={isPublishing || !isReady}
              className={styles.btnPublish}
              title={!isReady ? 'Completa todos los requisitos para publicar' : 'Publicar producto (Ctrl+P)'}
            >
              {isPublishing ? (
                <>
                  <Loader size={16} className={styles.spinning} /> Publicando...
                </>
              ) : (
                '✓ Publicar Producto'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Crear Nuevo Producto"
        size="lg"
        actions={modalActions}
        actionsClassName={styles.modalActions}
      >
      {/* Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <div className={styles.steps}>
          {stepTitles.map((title, idx) => {
            const isClickable = idx + 1 < currentStep;
            return (
              <div
                key={idx}
                className={`${styles.step} ${idx + 1 === currentStep ? styles.active : ''} ${idx + 1 < currentStep ? styles.completed : ''
                  }`}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : -1}
                onClick={isClickable ? () => setCurrentStep(idx + 1) : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCurrentStep(idx + 1);
                  }
                } : undefined}
                aria-disabled={!isClickable}
              >
                <div className={styles.stepNumber}>{idx + 1}</div>
                <span className={styles.stepLabel}>{title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className={styles.stepsContainer}>
        <AnimatePresence mode="wait" custom={currentStep > 2 ? -1 : 1}>
          <motion.div
            key={currentStep}
            custom={currentStep > 2 ? -1 : 1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className={styles.stepWrapper}
          >
            {currentStep === 1 && (
              <Step1BasicInfo
                ref={step1Ref}
                data={data}
                onDataChange={handleDataChange}
                categories={categories}
              />
            )}

            {currentStep === 2 && (
              <Step2VariantsImages
                ref={step2Ref}
                data={data}
                onDataChange={handleDataChange}
                categories={categories}
              />
            )}

            {currentStep === 3 && (
              <Step3ReviewPublish
                data={data}
                categories={categories}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>

    {/* Quick Actions Floating Toolbar */}
    {open && (
      <QuickActionsToolbar
        onSave={handleSaveDraft}
        onDuplicate={handleDuplicate}
        onPreview={handlePreview}
        onPublish={() => handlePublish(false)}
        onDiscard={handleClose}
        isLoading={isSavingDraft}
        isPublishing={isPublishing}
        canPublish={isReady}
        canDuplicate={!!data.name}
      />
    )}
  </>
);
}
