import { useState, useEffect, useRef } from 'react';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import {
  paymentClass,
  formatDateTime,
  formatPrice,
  PAYMENT_LABELS,
  NEXT_STEP_CONFIG,
  HAPPY_PATH_STEPS,
  STATUS_LABELS,
} from '../utils/ordersHelpers';
import { upsertAdminOrderShipment } from '../ordersService';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';
import styles from './OrderDetailContent.module.css';
import { logAdminActivity } from '../../../../services/adminActivityLogService';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelector } from './OrderStatusSelector';
import { OrderTimeline } from './OrderTimeline';
import { MessageSquare, Phone, Mail, Check, ArrowRight, MapPin, Package, ShieldCheck } from 'lucide-react';
import { formatOrderCode, formatOrderLabel } from '../../../../utils/orders';
import { Modal } from '../../../../components/ui/Modal';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

interface OrderDetailContentProps {
  order: Order;
  onClose?: () => void;
}

const CARRIER_OPTIONS = [
  { value: 'Tarifa Plana Express (AMBA / CABA)', label: 'Tarifa Plana Express (AMBA / CABA)' },
  { value: 'Envío a Domicilio (Correo)', label: 'Envío a Domicilio (Correo Nacional)' },
  { value: 'Envío a Sucursal de Correo', label: 'Envío a Sucursal de Correo (OCA / Andreani)' },
  { value: 'Envío Sin Cargo', label: 'Envío Sin Cargo (Monto Mínimo Cumplido)' },
  { value: 'Retiro en Punto de Entrega (Sin cargo)', label: 'Retiro en Punto de Entrega (Sin cargo)' },
  { value: 'OCA', label: 'OCA' },
  { value: 'Andreani', label: 'Andreani' },
  { value: 'Flete / Mensajería Privada', label: 'Flete / Mensajería Privada' },
];

const WAREHOUSE_OPTIONS = [
  { value: 'Depósito Central Allmart', label: 'Depósito Central Allmart' },
  { value: 'Sucursal Principal', label: 'Sucursal Principal' },
];

const PROVINCES_ARGENTINA = [
  { value: 'CABA', label: 'Ciudad Autónoma de Buenos Aires (CABA)' },
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' },
];

export const OrderDetailContent = ({ order, onClose }: OrderDetailContentProps) => {
  const { updateOrderStatus, updateOrder, deleteOrder, markAsPaid, toggleDeposit, refreshOrders } = useAdminOrders();
  const { can, token } = useAdminAuth();

  const [notes, setNotes] = useState(order.notes ?? '');
  const [savedNotesDisplay, setSavedNotesDisplay] = useState(order.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [saveNotesLoading, setSaveNotesLoading] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [deleteNotesConfirm, setDeleteNotesConfirm] = useState(false);

  // ── Modal independiente para Carga / Edición Directa de Dirección ──
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('Buenos Aires');
  const [addrZip, setAddrZip] = useState('');

  // ── Modales de Transición Guiada ──
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmPaymentMode, setConfirmPaymentMode] = useState<'deposit' | 'full' | 'cod'>('deposit');
  const [confirmRefNumber, setConfirmRefNumber] = useState('');
  const [confirmCustomNote, setConfirmCustomNote] = useState('');

  const [preparationModalOpen, setPreparationModalOpen] = useState(false);
  const [prepAddressStreet, setPrepAddressStreet] = useState('');
  const [prepAddressCity, setPrepAddressCity] = useState('CABA');
  const [prepAddressProvince, setPrepAddressProvince] = useState('Buenos Aires');
  const [prepAddressZip, setPrepAddressZip] = useState('1000');
  const [prepWarehouse, setPrepWarehouse] = useState('Depósito Central Allmart');
  const [prepShippingMethod, setPrepShippingMethod] = useState('Tarifa Plana Express (AMBA / CABA)');
  const [prepGlassProtection, setPrepGlassProtection] = useState(true);
  const [prepKraftFill, setPrepKraftFill] = useState(true);
  const [prepNote, setPrepNote] = useState('');

  const [readyModalOpen, setReadyModalOpen] = useState(false);
  const [readyPackagesCount, setReadyPackagesCount] = useState('1');
  const [readyLocation, setReadyLocation] = useState('Estantería B-04');
  const [readyNote, setReadyNote] = useState('');

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchCarrier, setDispatchCarrier] = useState('OCA');
  const [dispatchTracking, setDispatchTracking] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryCollectCash, setDeliveryCollectCash] = useState(true);
  const [deliveryReceiver, setDeliveryReceiver] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const originalStatusRef = useRef(order.status);
  const originalNotesRef = useRef(order.notes ?? '');

  useEffect(() => {
    setNotes(order.notes ?? '');
    setSavedNotesDisplay(order.notes ?? '');
    setPendingStatus(order.status);
    originalStatusRef.current = order.status;
    originalNotesRef.current = order.notes ?? '';
  }, [order]);

  useEffect(() => {
    if (order.shipment) {
      setPrepAddressStreet(order.shipment.addressStreet ?? '');
      setPrepAddressCity(order.shipment.addressCity ?? 'CABA');
      setPrepAddressProvince(order.shipment.addressProvince ?? 'Buenos Aires');
      setPrepAddressZip(order.shipment.addressZip ?? '1000');
      if (order.shipment.carrier) {
        setPrepShippingMethod(order.shipment.carrier);
      }
    }
  }, [order.shipment]);

  const isDirty =
    notes !== originalNotesRef.current ||
    pendingStatus !== originalStatusRef.current;

  const { setIsDirty: setGlobalDirty } = useUnsavedChanges();

  useEffect(() => {
    setGlobalDirty(isDirty);
  }, [isDirty, setGlobalDirty]);

  const paymentStatus: PaymentStatus = order.paymentStatus ?? 'no-abonado';
  const isAbonado = paymentStatus === 'abonado';
  const hasStatusChange = pendingStatus !== order.status;

  const auth = useAdminAuth();
  const userEmail = (auth && (auth.user as string)) || 'desconocido';

  const handleStatusApply = async (targetStatus?: OrderStatus, markPaidTogether = false) => {
    const finalStatus = targetStatus ?? pendingStatus;
    setStatusLoading(true);
    setStatusError(null);
    const prev = order.status;
    try {
      await updateOrderStatus(order.id, finalStatus, statusNote.trim() || undefined);
      if (markPaidTogether && !isAbonado) {
        await markAsPaid(order.id);
      }
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'update-status',
        entity: 'order',
        entityId: order.id,
        details: { from: prev, to: finalStatus, note: statusNote, markedPaid: markPaidTogether },
      });
      toast.success(`Pedido actualizado a ${STATUS_LABELS[finalStatus]}`);
      originalStatusRef.current = finalStatus;
      setPendingStatus(finalStatus);
      setStatusNote('');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('No se pudo actualizar el pedido');
      setPendingStatus(prev);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenAddressModal = () => {
    if (order.shipment) {
      setAddrStreet(order.shipment.addressStreet ?? '');
      setAddrCity(order.shipment.addressCity ?? 'CABA');
      setAddrProvince(order.shipment.addressProvince ?? 'Buenos Aires');
      setAddrZip(order.shipment.addressZip ?? '1000');
    } else {
      setAddrStreet('');
      setAddrCity('CABA');
      setAddrProvince('Buenos Aires');
      setAddrZip('1000');
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddressOnly = async () => {
    if (!token) return;
    setStatusLoading(true);
    try {
      const street = addrStreet.trim() || 'Dirección acordada';
      const city = addrCity.trim() || 'CABA';
      const province = addrProvince.trim() || 'Buenos Aires';
      const zip = addrZip.trim() || '1000';

      const savedShipment = await upsertAdminOrderShipment(token, order.id, {
        addressStreet: street,
        addressCity: city,
        addressProvince: province,
        addressZip: zip,
        carrier: order.shipment?.carrier,
        trackingNumber: order.shipment?.trackingNumber,
      });

      if (savedShipment) {
        order.shipment = savedShipment;
      }

      await refreshOrders();
      toast.success('Dirección de envío guardada correctamente');
      setAddressModalOpen(false);
    } catch (err) {
      console.error('Error guardando dirección:', err);
      toast.error('Error al guardar la dirección de envío');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleTriggerNextStep = (nextStatus: OrderStatus) => {
    if (nextStatus === 'confirmado') {
      setConfirmPaymentMode(order.has50PercentDeposit ? 'deposit' : isAbonado ? 'full' : 'deposit');
      setConfirmRefNumber('');
      setConfirmCustomNote('');
      setConfirmModalOpen(true);
      return;
    }

    if (nextStatus === 'en-preparacion') {
      setPrepAddressStreet(order.shipment?.addressStreet ?? '');
      setPrepAddressCity(order.shipment?.addressCity ?? 'CABA');
      setPrepAddressProvince(order.shipment?.addressProvince ?? 'Buenos Aires');
      setPrepAddressZip(order.shipment?.addressZip ?? '1000');
      if (order.shipment?.carrier) {
        setPrepShippingMethod(order.shipment.carrier);
      }
      setPrepWarehouse('Depósito Central Allmart');
      setPrepGlassProtection(true);
      setPrepKraftFill(true);
      setPrepNote('');
      setPreparationModalOpen(true);
      return;
    }

    if (nextStatus === 'preparado') {
      setReadyPackagesCount('1');
      setReadyLocation('Zona de Despacho B-04');
      setReadyNote('');
      setReadyModalOpen(true);
      return;
    }

    if (nextStatus === 'enviado') {
      setDispatchCarrier(order.shipment?.carrier ?? 'OCA');
      setDispatchTracking(order.shipment?.trackingNumber ?? '');
      setDispatchNote('');
      setDispatchModalOpen(true);
      return;
    }

    if (nextStatus === 'entregado') {
      setDeliveryCollectCash(!isAbonado);
      setDeliveryReceiver(`${order.customer.firstName} ${order.customer.lastName}`);
      setDeliveryNote('');
      setDeliveryModalOpen(true);
      return;
    }

    setPendingStatus(nextStatus);
    handleStatusApply(nextStatus);
  };

  const handleExecuteConfirmOrder = async () => {
    setStatusLoading(true);
    try {
      if (confirmPaymentMode === 'deposit' && !order.has50PercentDeposit) {
        await toggleDeposit(order.id);
      } else if (confirmPaymentMode === 'full' && !isAbonado) {
        await markAsPaid(order.id);
      }

      const refNote = confirmRefNumber.trim() ? ` (Comprobante: ${confirmRefNumber.trim()})` : '';
      const modeText = confirmPaymentMode === 'deposit'
        ? 'Seña del 50% acreditada'
        : confirmPaymentMode === 'full'
        ? 'Pago 100% acreditado'
        : 'Efectivo contra entrega aprobado';

      const combinedNote = `Pedido confirmado. ${modeText}${refNote}${confirmCustomNote.trim() ? `. ${confirmCustomNote.trim()}` : ''}`;

      await updateOrderStatus(order.id, 'confirmado', combinedNote);
      await refreshOrders();
      originalStatusRef.current = 'confirmado';
      setPendingStatus('confirmado');

      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'confirm-order',
        entity: 'order',
        entityId: order.id,
        details: { paymentMode: confirmPaymentMode, refNumber: confirmRefNumber },
      });

      toast.success(`Pedido #${formatOrderCode(order.id)} confirmado exitosamente`);
      setConfirmModalOpen(false);
    } catch (err) {
      console.error('Error al confirmar el pedido:', err);
      toast.error('Error al confirmar el pedido');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExecutePreparation = async () => {
    setStatusLoading(true);
    try {
      const street = prepAddressStreet.trim() || 'Dirección acordada con cliente';
      const city = prepAddressCity.trim() || 'CABA';
      const province = prepAddressProvince.trim() || 'Buenos Aires';
      const zip = prepAddressZip.trim() || '1000';

      if (token) {
        const savedShipment = await upsertAdminOrderShipment(token, order.id, {
          addressStreet: street,
          addressCity: city,
          addressProvince: province,
          addressZip: zip,
          carrier: prepShippingMethod,
        });
        if (savedShipment) {
          order.shipment = savedShipment;
        }
      }

      const packingSummary = [];
      if (prepGlassProtection) packingSummary.push('Protección Vidrio/Cerámica');
      if (prepKraftFill) packingSummary.push('Relleno Kraft');

      const combinedNote = `Iniciada preparación en ${prepWarehouse}. Método: ${prepShippingMethod}. Dirección: ${street}, ${city}. ${packingSummary.length > 0 ? `[Embalaje: ${packingSummary.join(', ')}]. ` : ''}${prepNote.trim() ? `Nota: ${prepNote.trim()}` : ''}`;

      await updateOrderStatus(order.id, 'en-preparacion', combinedNote);
      await refreshOrders();
      originalStatusRef.current = 'en-preparacion';
      setPendingStatus('en-preparacion');

      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'preparation-order',
        entity: 'order',
        entityId: order.id,
        details: { warehouse: prepWarehouse, street, city, shippingMethod: prepShippingMethod },
      });

      toast.success('Pedido en preparación. Datos de envío y embalaje registrados.');
      setPreparationModalOpen(false);
    } catch (err) {
      console.error('Error al iniciar preparación:', err);
      toast.error('Error al iniciar la preparación del pedido');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExecuteReady = async () => {
    setStatusLoading(true);
    try {
      const pkgs = readyPackagesCount.trim() || '1';
      const loc = readyLocation.trim() || 'Zona de Expedición';
      const combinedNote = `Bulto preparado (${pkgs} caja/s) en ${loc}. ${readyNote.trim() ? `Nota: ${readyNote.trim()}` : ''}`;

      await updateOrderStatus(order.id, 'preparado', combinedNote);
      await refreshOrders();
      originalStatusRef.current = 'preparado';
      setPendingStatus('preparado');

      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'ready-order',
        entity: 'order',
        entityId: order.id,
        details: { packages: pkgs, location: loc },
      });

      toast.success('Bulto preparado y listo para despacho');
      setReadyModalOpen(false);
    } catch (err) {
      console.error('Error al marcar preparado:', err);
      toast.error('Error al marcar el paquete como preparado');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExecuteDispatch = async () => {
    setStatusLoading(true);
    try {
      const trackingText = dispatchTracking.trim() ? ` (Guía/Seguimiento: ${dispatchTracking.trim()})` : '';
      const combinedNote = `Despachado vía ${dispatchCarrier}${trackingText}${dispatchNote.trim() ? `. ${dispatchNote.trim()}` : ''}`;

      await updateOrderStatus(order.id, 'enviado', combinedNote);

      if (token && (dispatchCarrier || dispatchTracking)) {
        const savedShipment = await upsertAdminOrderShipment(token, order.id, {
          carrier: dispatchCarrier,
          trackingNumber: dispatchTracking.trim() || undefined,
        });
        if (savedShipment) {
          order.shipment = savedShipment;
        }
      }

      await refreshOrders();
      originalStatusRef.current = 'enviado';
      setPendingStatus('enviado');

      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'dispatch-order',
        entity: 'order',
        entityId: order.id,
        details: { carrier: dispatchCarrier, tracking: dispatchTracking },
      });

      toast.success(`Pedido despachado por ${dispatchCarrier}`);
      setDispatchModalOpen(false);
    } catch (err) {
      console.error('Error al despachar el pedido:', err);
      toast.error('Error al despachar el pedido');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExecuteDelivery = async () => {
    setStatusLoading(true);
    try {
      if (deliveryCollectCash && !isAbonado) {
        await markAsPaid(order.id);
      }

      const receiverText = deliveryReceiver.trim() ? ` (Recibió: ${deliveryReceiver.trim()})` : '';
      const combinedNote = `Pedido entregado y completado${receiverText}${deliveryNote.trim() ? `. ${deliveryNote.trim()}` : ''}`;

      await updateOrderStatus(order.id, 'entregado', combinedNote);
      await refreshOrders();
      originalStatusRef.current = 'entregado';
      setPendingStatus('entregado');

      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'deliver-order',
        entity: 'order',
        entityId: order.id,
        details: { collectedCash: deliveryCollectCash, receiver: deliveryReceiver },
      });

      toast.success('Pedido entregado y cerrado');
      setDeliveryModalOpen(false);
    } catch (err) {
      console.error('Error al marcar como entregado:', err);
      toast.error('Error al marcar como entregado');
    } finally {
      setStatusLoading(false);
    }
  };

  const currentStatus = order.status;

  const handleSaveNotes = async () => {
    const nextValue = notes.trim();
    if (saveNotesLoading) return;
    setSaveNotesLoading(true);
    try {
      await updateOrder(order.id, { notes: nextValue });
      originalNotesRef.current = nextValue;
      setSavedNotesDisplay(nextValue);
      setNotes(nextValue);
      setNotesEditing(false);
      setDeleteNotesConfirm(false);
      toast.success('Notas internas guardadas con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudieron guardar las notas: ${message}`);
    } finally {
      setSaveNotesLoading(false);
    }
  };

  const handleDeleteNotes = async () => {
    try {
      setSaveNotesLoading(true);
      await updateOrder(order.id, { notes: '' });
      originalNotesRef.current = '';
      setSavedNotesDisplay('');
      setNotes('');
      setNotesEditing(false);
      setDeleteNotesConfirm(false);
      toast.success('Nota eliminada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo eliminar la nota: ${message}`);
    } finally {
      setSaveNotesLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(order.id);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'delete',
        entity: 'order',
        entityId: order.id,
        details: {},
      });
      toast.success('Pedido eliminado con éxito');
      onClose?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo eliminar el pedido: ${message}`);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      await markAsPaid(orderId);
      toast.success('Pedido marcado como abonado');
    } catch {
      toast.error('Error al marcar como abonado');
    }
  };

  const handleToggleDeposit = async () => {
    try {
      setDepositLoading(true);
      await toggleDeposit(order.id);
      const action = order.has50PercentDeposit ? 'desactivada' : 'activada';
      toast.success(`Seña del 50% ${action}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al actualizar seña: ${message}`);
    } finally {
      setDepositLoading(false);
    }
  };

  const initials = `${order.customer?.firstName?.[0] ?? ''}${order.customer?.lastName?.[0] ?? ''}`;

  const halfTotal = order.total / 2;
  const isDepositActive = order.has50PercentDeposit ?? false;
  const remainingAmount = isAbonado ? 0 : isDepositActive ? halfTotal : order.total;

  const nextStepInfo = NEXT_STEP_CONFIG[order.status];
  const currentStepIndex = HAPPY_PATH_STEPS.indexOf(order.status);

  return (
    <div className={`${styles.detailContent} orderDetailContentDesktopGrid`}>
      <style>{`
        /* 📱 MÓVIL / TABLET (<1024px) */
        @media (max-width: 1023px) {
          .orderDetailContentDesktopGrid {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .orderDetailContentDesktopGrid .orderDetailMainCol,
          .orderDetailContentDesktopGrid .orderDetailSideCol {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        /* 💻 ESCRITORIO (>=1024px) */
        @media (min-width: 1024px) {
          .orderDetailContentDesktopGrid {
            display: grid !important;
            grid-template-columns: 1fr 380px !important;
            gap: 24px !important;
            align-items: start !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .orderDetailContentDesktopGrid .orderDetailMainCol {
            min-width: 0 !important;
            width: 100% !important;
          }
          .orderDetailContentDesktopGrid .orderDetailSideCol {
            width: 100% !important;
            max-width: 420px !important;
          }
        }

        /* 🖥️ ESCRITORIO ANCHO (>=1400px) */
        @media (min-width: 1400px) {
          .orderDetailContentDesktopGrid {
            grid-template-columns: 1fr 420px !important;
            gap: 28px !important;
          }
        }

        /* Estilos del Pipeline Stepper */
        .orderStepperBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--color-bg-secondary, #28353d);
          border: 1px solid var(--color-border, #374151);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          overflow-x: auto;
          box-sizing: border-box;
        }
        .orderStepItem {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary, #9ca3af);
          white-space: nowrap;
        }
        .orderStepItemCompleted {
          color: var(--color-primary, #769282);
        }
        .orderStepItemActive {
          color: var(--color-accent, #DDB08C);
          font-weight: 700;
        }
        .orderStepDot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--color-border, #374151);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }
        .orderStepDotCompleted {
          background: var(--color-primary, #769282);
          color: #ffffff;
          border-color: var(--color-primary, #769282);
        }
        .orderStepDotActive {
          background: var(--color-accent, #DDB08C);
          color: #111827;
          border-color: var(--color-accent, #DDB08C);
        }
        .orderStepDivider {
          flex: 1;
          height: 2px;
          background: var(--color-border, #374151);
          margin: 0 10px;
          min-width: 16px;
        }
        .orderStepDividerCompleted {
          background: var(--color-primary, #769282);
        }

        /* Botón Táctico de Siguiente Paso */
        .smartNextStepBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(118, 146, 130, 0.12);
          border: 1px solid var(--color-primary, #769282);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .smartNextStepBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--color-primary, #769282);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .smartNextStepBtn:hover:not(:disabled) {
          background: var(--color-primary-dark, #5d7568);
        }

        /* Modal Styles */
        .guidedModalForm {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .radioOptionGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .radioOptionCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--color-bg-secondary, #28353d);
          border: 1px solid var(--color-border, #374151);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .radioOptionCardActive {
          border-color: var(--color-primary, #769282);
          background: rgba(118, 146, 130, 0.15);
        }
        .radioOptionInput {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary, #769282);
          cursor: pointer;
        }
        .radioOptionText {
          display: flex;
          flex-direction: column;
          gap: 2px;
          cursor: pointer;
        }
        .radioOptionTitle {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary, #ffffff);
        }
        .radioOptionSub {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
        }
      `}</style>

      {/* ── COLUMNA PRINCIPAL (65% en Desktop) ── */}
      <div className={`${styles.mainColumn} orderDetailMainCol`}>
        {/* Pipeline Stepper del Ciclo de Vida */}
        {order.status !== 'cancelado' && (
          <div className="orderStepperBar">
            {HAPPY_PATH_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex > idx;
              const isActive = currentStepIndex === idx;

              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < HAPPY_PATH_STEPS.length - 1 ? 1 : 'none' }}>
                  <div className={`orderStepItem ${isCompleted ? 'orderStepItemCompleted' : ''} ${isActive ? 'orderStepItemActive' : ''}`}>
                    <span className={`orderStepDot ${isCompleted ? 'orderStepDotCompleted' : ''} ${isActive ? 'orderStepDotActive' : ''}`}>
                      {isCompleted ? <Check size={12} /> : idx + 1}
                    </span>
                    <span>{STATUS_LABELS[step]}</span>
                  </div>
                  {idx < HAPPY_PATH_STEPS.length - 1 && (
                    <div className={`orderStepDivider ${isCompleted ? 'orderStepDividerCompleted' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Smart Next Step Call-to-Action Bar */}
        {can('orders.edit') && nextStepInfo?.nextStatus && (
          <div className="smartNextStepBar">
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block' }}>
                Siguiente paso sugerido:
              </span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                {nextStepInfo.icon} {nextStepInfo.label}
              </strong>
            </div>
            <button
              type="button"
              className="smartNextStepBtn"
              onClick={() => handleTriggerNextStep(nextStepInfo.nextStatus!)}
              disabled={statusLoading}
            >
              <span>Avanzar pedido</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Sección 1: Estado del Pedido ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Estado del Pedido</h3>
          <div className={styles.statusRow}>
            <OrderStatusBadge status={pendingStatus} />
            {can('orders.edit') && (
              <OrderStatusSelector
                value={pendingStatus}
                onChange={s => {
                  const newStatus = s as OrderStatus;
                  setPendingStatus(newStatus);
                  const newIsDirty = newStatus !== originalStatusRef.current || notes !== originalNotesRef.current;
                  setGlobalDirty(newIsDirty);
                }}
                disabled={statusLoading}
              />
            )}
            {statusLoading && <span className={styles.statusLoading}>⏳</span>}
          </div>
          {can('orders.edit') && hasStatusChange && (
            <div className={styles.statusChangeBox}>
              <input
                className={styles.statusNoteInput}
                type="text"
                placeholder="Nota del cambio (opcional, ej: enviado por OCA #123)..."
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                maxLength={120}
                disabled={statusLoading}
              />
              <div className={styles.statusChangeActions}>
                <button
                  className={styles.applyStatusBtn}
                  type="button"
                  onClick={() => handleStatusApply()}
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Guardando...' : 'Guardar cambio'}
                </button>
                <button
                  className={styles.cancelBtn}
                  type="button"
                  onClick={() => { setPendingStatus(currentStatus); setStatusNote(''); }}
                  disabled={statusLoading}
                >
                  Cancelar
                </button>
              </div>
              {statusError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{statusError}</div>}
            </div>
          )}
        </section>

        {/* ── Sección 2: Tabla de Productos ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>
            Productos · {order.items.reduce((s, i) => s + i.quantity, 0)} ítems
          </h3>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th className={styles.tdLeft}>Producto</th>
                <th className={styles.tdCenter}>Cant.</th>
                <th className={styles.tdRight}>P. unit.</th>
                <th className={styles.tdRight}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={`${item.productId}-${item.productSkuId ?? 'base'}-${item.productName}`}>
                  <td data-label="Producto" className={styles.tdProduct}>
                    <div className={styles.tdProductName}>{item.productName}</div>
                    {(item.variant || item.sku) && (
                      <div className={styles.itemVariant}>
                        {item.variant || item.sku}
                        {item.variant && item.sku ? ` · ${item.sku}` : ''}
                      </div>
                    )}
                  </td>
                  <td data-label="Cant." className={styles.tdCenter}>{item.quantity}</td>
                  <td data-label="P. unit." className={styles.tdRight}>{formatPrice(item.unitPrice)}</td>
                  <td data-label="Subtotal" className={styles.tdRight}>{formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className={styles.totalLabel}>Total del Pedido</td>
                <td className={`${styles.tdRight} ${styles.totalValue}`}>{formatPrice(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* ── Sección 3: Historial de Estados ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Historial de Estados</h3>
          <OrderTimeline history={order.statusHistory ?? []} currentStatus={order.status} />
        </section>

        {/* ── Sección 4: Notas Internas con Vista de Persistencia ── */}
        {can('orders.edit') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Notas Internas</h3>

            {savedNotesDisplay && !notesEditing ? (
              <>
                <p className={styles.savedNotesText}>{savedNotesDisplay}</p>
                <div className={styles.editorActions}>
                  <button
                    type="button"
                    className={styles.noteActionBtn}
                    aria-label="Editar nota"
                    onClick={() => {
                      setNotes(savedNotesDisplay);
                      setNotesEditing(true);
                      setDeleteNotesConfirm(false);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={`${styles.noteActionBtn} ${styles.noteActionDelete}`}
                    aria-label="Eliminar nota"
                    onClick={() => setDeleteNotesConfirm(true)}
                  >
                    Eliminar
                  </button>
                </div>

                {deleteNotesConfirm && (
                  <div className={styles.deleteConfirmationBox}>
                    <p>¿Eliminar esta nota?</p>
                    <div className={styles.confirmActions}>
                      <button
                        type="button"
                        className={styles.confirmDeleteBtn}
                        aria-label="Sí, borrar"
                        onClick={() => void handleDeleteNotes()}
                      >
                        Sí, borrar
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        aria-label="Cancelar eliminación"
                        onClick={() => setDeleteNotesConfirm(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {notesEditing && (
              <div className={styles.notesEditorBox}>
                <textarea
                  className={styles.notesInput}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  aria-label="Editar nota interna"
                  placeholder="Escribí notas internas sobre este pedido..."
                />

                <div className={styles.editorActions}>
                  <button
                    className={styles.saveNotesBtn}
                    type="button"
                    onClick={() => void handleSaveNotes()}
                    disabled={saveNotesLoading}
                    aria-label="Guardar nota"
                  >
                    {saveNotesLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    className={styles.cancelBtn}
                    type="button"
                    onClick={() => {
                      setNotes(savedNotesDisplay || '');
                      setNotesEditing(false);
                      setDeleteNotesConfirm(false);
                    }}
                    aria-label="Cancelar edición"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {!savedNotesDisplay && !notesEditing && (
              <div className={styles.notesEditorBox}>
                <textarea
                  className={styles.notesInput}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  aria-label="Editar nota interna"
                  placeholder="Escribí notas internas sobre este pedido..."
                />

                <div className={styles.editorActions}>
                  <button
                    className={styles.saveNotesBtn}
                    type="button"
                    onClick={() => void handleSaveNotes()}
                    disabled={saveNotesLoading}
                    aria-label="Guardar notas"
                  >
                    {saveNotesLoading ? 'Guardando...' : 'Guardar notas'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── COLUMNA LATERAL (35% en Desktop) ── */}
      <div className={`${styles.sideColumn} orderDetailSideCol`}>
        {/* ── Tarjeta CRM: Datos del Cliente ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Datos del Cliente</h3>
          <div className={styles.customerCard}>
            <div className={styles.customerAvatar}>{initials}</div>
            <div className={styles.customerInfo}>
              <span className={styles.customerFullName}>
                {order.customer.firstName} {order.customer.lastName}
              </span>
              <a href={`mailto:${order.customer.email}`} className={styles.customerEmailText}>
                {order.customer.email}
              </a>
              {order.customer.phone && (
                <a href={`tel:${order.customer.phone}`} className={styles.customerPhoneText}>
                  <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {order.customer.phone}
                </a>
              )}
            </div>
          </div>

          <div className={styles.customerActions}>
            <a
              href={`mailto:${order.customer.email}?subject=Pedido%20${formatOrderLabel(order.id)}`}
              className={styles.customerActionBtn}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={14} /> Email
            </a>
            {order.customer.phone && (
              <a
                href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`}
                className={styles.customerActionBtn}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* ── Tarjeta Logística: Datos de Envío ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>
            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
            Datos de Envío y Despacho
          </h3>

          {order.shipment ? (
            <div className={styles.customerCard} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block' }}>Dirección de entrega</span>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block', marginTop: 2 }}>{order.shipment.addressStreet}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {order.shipment.addressCity}, {order.shipment.addressProvince} ({order.shipment.addressZip})
                </span>
              </div>

              {(order.shipment.carrier || order.shipment.trackingNumber) && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 4 }}>
                  {order.shipment.carrier && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Empresa:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{order.shipment.carrier}</strong>
                    </div>
                  )}
                  {order.shipment.trackingNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>N° Seguimiento:</span>
                      <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{order.shipment.trackingNumber}</strong>
                    </div>
                  )}
                </div>
              )}

              {can('orders.edit') && (
                <button
                  type="button"
                  className={styles.saveNotesBtn}
                  style={{ marginTop: 6, width: '100%', minHeight: '36px', fontSize: '13px' }}
                  onClick={handleOpenAddressModal}
                >
                  ✏️ Editar Dirección de Envío
                </button>
              )}
            </div>
          ) : (
            <div className={styles.customerCard} style={{ flexDirection: 'column', alignItems: 'center', padding: '16px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Sin dirección de envío cargada</span>
              {can('orders.edit') && (
                <button
                  type="button"
                  className={styles.saveNotesBtn}
                  style={{ width: '100%', minHeight: '36px', fontSize: '13px' }}
                  onClick={handleOpenAddressModal}
                >
                  + Cargar Dirección de Envío
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Tarjeta Financiera: Estado del Pago y Seña ── */}
        {can('orders.markPaid') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Resumen Financiero y Pago</h3>

            <div className={styles.financialGrid}>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Estado del cobro</span>
                <span className={`${styles.paymentBadge} ${paymentClass(paymentStatus, styles)}`}>
                  {isAbonado ? '✓' : '○'} {PAYMENT_LABELS[paymentStatus]}
                </span>
              </div>

              {isAbonado && order.paidAt && (
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>Fecha de pago</span>
                  <span className={styles.paidAt}>{formatDateTime(order.paidAt)}</span>
                </div>
              )}

              <div className={styles.financialDivider} />

              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Total Pedido</span>
                <span className={styles.financialValue}>{formatPrice(order.total)}</span>
              </div>

              {!isAbonado && (
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>Restante a cobrar</span>
                  <span className={`${styles.financialValue} ${styles.financialHighlight}`}>
                    {formatPrice(remainingAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Control de Seña 50% */}
            <div className={styles.depositBox}>
              <div className={styles.depositLabelGroup}>
                <span className={styles.depositLabel}>Seña del 50%</span>
                {isDepositActive && (
                  <span className={styles.depositActiveBadge}>
                    Registrada
                  </span>
                )}
              </div>
              <button
                className={`${styles.depositBtn} ${isDepositActive ? styles.depositBtnActive : ''}`}
                type="button"
                onClick={handleToggleDeposit}
                disabled={depositLoading || isAbonado}
              >
                {depositLoading ? '...' : isDepositActive ? '✓ 50% Señado' : 'Activar 50%'}
              </button>
            </div>

            {/* Acción Dinámica Marcar como Abonado / Registrar Cobro de Saldo Restante */}
            {!isAbonado && (
              <div className={styles.whatsappActions}>
                {!confirmPaid ? (
                  <button
                    className={styles.whatsappBtn}
                    type="button"
                    onClick={() => setConfirmPaid(true)}
                  >
                    ✓ {isDepositActive
                      ? `Registrar Cobro de Saldo Restante (${formatPrice(remainingAmount)})`
                      : `Marcar como abonado (${formatPrice(order.total)})`}
                  </button>
                ) : (
                  <div className={styles.confirmPaidBox}>
                    <span className={styles.confirmPaidText}>
                      {isDepositActive
                        ? `¿Confirmar cobro final del saldo restante de ${formatPrice(remainingAmount)}?`
                        : `¿Confirmar cobro completo de ${formatPrice(order.total)}?`}
                    </span>
                    <div className={styles.confirmPaidActions}>
                      <button
                        className={styles.whatsappBtnConfirm}
                        type="button"
                        onClick={async () => { await handleMarkAsPaid(order.id); setConfirmPaid(false); }}
                      >
                        Sí, registrar cobro
                      </button>
                      <button
                        className={styles.cancelBtn}
                        type="button"
                        onClick={() => setConfirmPaid(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Tarjeta: Zona Peligrosa ── */}
        {can('orders.delete') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Zona Peligrosa</h3>
            <div className={styles.dangerSection}>
              {!confirmDelete ? (
                <Tooltip content="Eliminar este pedido. Esta acción no se puede deshacer.">
                  <button
                    className={styles.deleteBtn}
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Eliminar pedido"
                  >
                    🗑️ Eliminar este pedido
                  </button>
                </Tooltip>
              ) : (
                <div className={styles.confirmDelete}>
                  <span>¿Seguro que querés eliminar este pedido? Esta acción no se puede deshacer.</span>
                  <div className={styles.confirmActions}>
                    <button
                      className={styles.deleteConfirmBtn}
                      type="button"
                      onClick={handleDelete}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      className={styles.cancelBtn}
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── MODAL INDEPENDIENTE: DIRECCIÓN DE ENVÍO ── */}
      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Datos de Dirección de Envío"
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleSaveAddressOnly}
              disabled={statusLoading}
            >
              {statusLoading ? 'Guardando...' : 'Guardar Dirección'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setAddressModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          <div>
            <label className={styles.detailSectionTitle} htmlFor="addr-street-input" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Calle y Número / Piso / Dpto *</label>
            <input
              id="addr-street-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Av. Corrientes 1234, 4° B"
              value={addrStreet}
              onChange={e => setAddrStreet(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className={styles.detailSectionTitle} htmlFor="addr-city-input" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Ciudad / Localidad *</label>
              <input
                id="addr-city-input"
                type="text"
                className={styles.statusNoteInput}
                placeholder="Ej: CABA"
                value={addrCity}
                onChange={e => setAddrCity(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.detailSectionTitle} htmlFor="addr-province-select" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Provincia *</label>
              <Dropdown
                id="addr-province-select"
                options={PROVINCES_ARGENTINA}
                value={addrProvince}
                onChange={setAddrProvince}
                placeholder="Seleccionar provincia..."
              />
            </div>
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="addr-zip-input" style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Código Postal</label>
            <input
              id="addr-zip-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: C1043"
              value={addrZip}
              onChange={e => setAddrZip(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL 1: CONFIRMACIÓN Y RESPALDO FINANCIERO (Pendiente ➔ Confirmado) ── */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={`Confirmar Pedido #${formatOrderCode(order.id)}`}
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleExecuteConfirmOrder}
              disabled={statusLoading}
            >
              {statusLoading ? 'Confirmando...' : '✓ Confirmar y Reservar Stock'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setConfirmModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          <div style={{ padding: '12px 14px', background: 'rgba(118, 146, 130, 0.12)', borderRadius: '10px', border: '1px solid var(--color-primary)' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block' }}>Total del pedido a respaldar:</span>
            <strong style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>{formatPrice(order.total)}</strong>
          </div>

          <div>
            <span className={styles.detailSectionTitle} style={{ marginBottom: '8px', display: 'block' }}>
              Modalidad de Pago / Respaldo *
            </span>
            <div className="radioOptionGroup">
              <div
                className={`radioOptionCard ${confirmPaymentMode === 'deposit' ? 'radioOptionCardActive' : ''}`}
                onClick={() => setConfirmPaymentMode('deposit')}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setConfirmPaymentMode('deposit')}
              >
                <input
                  id="confirm-mode-deposit"
                  type="radio"
                  name="confirmPaymentMode"
                  className="radioOptionInput"
                  checked={confirmPaymentMode === 'deposit'}
                  onChange={() => setConfirmPaymentMode('deposit')}
                />
                <label htmlFor="confirm-mode-deposit" className="radioOptionText">
                  <span className="radioOptionTitle">Seña del 50% ({formatPrice(halfTotal)})</span>
                  <span className="radioOptionSub">Acredita seña y reserva producto. Cobro restante en entrega: {formatPrice(halfTotal)}.</span>
                </label>
              </div>

              <div
                className={`radioOptionCard ${confirmPaymentMode === 'full' ? 'radioOptionCardActive' : ''}`}
                onClick={() => setConfirmPaymentMode('full')}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setConfirmPaymentMode('full')}
              >
                <input
                  id="confirm-mode-full"
                  type="radio"
                  name="confirmPaymentMode"
                  className="radioOptionInput"
                  checked={confirmPaymentMode === 'full'}
                  onChange={() => setConfirmPaymentMode('full')}
                />
                <label htmlFor="confirm-mode-full" className="radioOptionText">
                  <span className="radioOptionTitle">Pago 100% Acreditado ({formatPrice(order.total)})</span>
                  <span className="radioOptionSub">Registra cobro abonado total con fecha y hora.</span>
                </label>
              </div>

              <div
                className={`radioOptionCard ${confirmPaymentMode === 'cod' ? 'radioOptionCardActive' : ''}`}
                onClick={() => setConfirmPaymentMode('cod')}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setConfirmPaymentMode('cod')}
              >
                <input
                  id="confirm-mode-cod"
                  type="radio"
                  name="confirmPaymentMode"
                  className="radioOptionInput"
                  checked={confirmPaymentMode === 'cod'}
                  onChange={() => setConfirmPaymentMode('cod')}
                />
                <label htmlFor="confirm-mode-cod" className="radioOptionText">
                  <span className="radioOptionTitle">Efectivo contra entrega / Cobro en destino</span>
                  <span className="radioOptionSub">Aprueba el pedido para cobro total en mano al momento de la entrega.</span>
                </label>
              </div>
            </div>
          </div>

          {confirmPaymentMode !== 'cod' && (
            <div>
              <label className={styles.detailSectionTitle} htmlFor="confirm-ref-number" style={{ marginBottom: '6px', display: 'block' }}>
                N° de Comprobante / Referencia de Transferencia (opcional)
              </label>
              <input
                id="confirm-ref-number"
                type="text"
                className={styles.statusNoteInput}
                placeholder="Ej: Ref. 89412004 / CBU Mercado Pago"
                value={confirmRefNumber}
                onChange={e => setConfirmRefNumber(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className={styles.detailSectionTitle} htmlFor="confirm-custom-note" style={{ marginBottom: '6px', display: 'block' }}>
              Nota interna adicional (opcional)
            </label>
            <input
              id="confirm-custom-note"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Cliente confirmó transferencia vía WhatsApp"
              value={confirmCustomNote}
              onChange={e => setConfirmCustomNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL 2: INICIO DE EMBALAJE Y DIRECCIÓN (Confirmado ➔ En preparación) ── */}
      <Modal
        open={preparationModalOpen}
        onClose={() => setPreparationModalOpen(false)}
        title={`Iniciar Preparación - Pedido #${formatOrderCode(order.id)}`}
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleExecutePreparation}
              disabled={statusLoading}
            >
              {statusLoading ? 'Iniciando...' : '📦 Iniciar Embalaje y Guardar Datos'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setPreparationModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          <div>
            <label className={styles.detailSectionTitle} htmlFor="prep-shipping-method-select" style={{ marginBottom: '6px', display: 'block' }}>
              Opción / Modalidad de Envío del Cliente *
            </label>
            <Dropdown
              id="prep-shipping-method-select"
              options={CARRIER_OPTIONS}
              value={prepShippingMethod}
              onChange={setPrepShippingMethod}
              placeholder="Seleccionar modalidad de envío..."
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="prep-warehouse-select" style={{ marginBottom: '6px', display: 'block' }}>
              Depósito / Sucursal de Armado *
            </label>
            <Dropdown
              id="prep-warehouse-select"
              options={WAREHOUSE_OPTIONS}
              value={prepWarehouse}
              onChange={setPrepWarehouse}
              placeholder="Seleccionar depósito..."
            />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <span className={styles.detailSectionTitle} style={{ marginBottom: '8px', display: 'block' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
              Dirección de Entrega / Despacho
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className={styles.detailSectionTitle} htmlFor="prep-address-street" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Calle y Número / Piso / Dpto</label>
                <input
                  id="prep-address-street"
                  type="text"
                  className={styles.statusNoteInput}
                  placeholder="Ej: Av. Corrientes 1234, 4° B"
                  value={prepAddressStreet}
                  onChange={e => setPrepAddressStreet(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className={styles.detailSectionTitle} htmlFor="prep-address-city" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Ciudad / Localidad</label>
                  <input
                    id="prep-address-city"
                    type="text"
                    className={styles.statusNoteInput}
                    placeholder="Ej: CABA"
                    value={prepAddressCity}
                    onChange={e => setPrepAddressCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.detailSectionTitle} htmlFor="prep-address-province" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Provincia</label>
                  <Dropdown
                    id="prep-address-province"
                    options={PROVINCES_ARGENTINA}
                    value={prepAddressProvince}
                    onChange={setPrepAddressProvince}
                    placeholder="Seleccionar provincia..."
                  />
                </div>
              </div>

              <div>
                <label className={styles.detailSectionTitle} htmlFor="prep-address-zip" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Código Postal</label>
                <input
                  id="prep-address-zip"
                  type="text"
                  className={styles.statusNoteInput}
                  placeholder="Ej: C1043"
                  value={prepAddressZip}
                  onChange={e => setPrepAddressZip(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <span className={styles.detailSectionTitle} style={{ marginBottom: '8px', display: 'block' }}>
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              Guía Interna de Protección y Embalaje
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="prep-glass-check" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                <input
                  id="prep-glass-check"
                  type="checkbox"
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  checked={prepGlassProtection}
                  onChange={e => setPrepGlassProtection(e.target.checked)}
                />
                <span>Protección para Vidrio/Cerámica (Cartón corrugado + burbuja)</span>
              </label>

              <label htmlFor="prep-kraft-check" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                <input
                  id="prep-kraft-check"
                  type="checkbox"
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  checked={prepKraftFill}
                  onChange={e => setPrepKraftFill(e.target.checked)}
                />
                <span>Relleno de estabilización Kraft (sin espacios vacíos)</span>
              </label>
            </div>
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="prep-note-input" style={{ marginBottom: '6px', display: 'block' }}>
              Nota de embalaje (opcional)
            </label>
            <input
              id="prep-note-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Embalar con cuidado especial por tratarse de cristalería"
              value={prepNote}
              onChange={e => setPrepNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL 3: BULTO PREPARADO (En preparación ➔ Preparado) ── */}
      <Modal
        open={readyModalOpen}
        onClose={() => setReadyModalOpen(false)}
        title={`Marcar Bulto Preparado - Pedido #${formatOrderCode(order.id)}`}
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleExecuteReady}
              disabled={statusLoading}
            >
              {statusLoading ? 'Guardando...' : '🏷️ Marcar como Bulto Preparado'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setReadyModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          <div>
            <label className={styles.detailSectionTitle} htmlFor="ready-packages-input" style={{ marginBottom: '6px', display: 'block' }}>
              <Package size={14} style={{ display: 'inline', marginRight: 4 }} />
              Cantidad de Bultos / Cajas
            </label>
            <input
              id="ready-packages-input"
              type="number"
              min="1"
              className={styles.statusNoteInput}
              value={readyPackagesCount}
              onChange={e => setReadyPackagesCount(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="ready-location-input" style={{ marginBottom: '6px', display: 'block' }}>
              Ubicación en Estantería de Expedición
            </label>
            <input
              id="ready-location-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Estante B-04 / Zona de Retiro"
              value={readyLocation}
              onChange={e => setReadyLocation(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="ready-note-input" style={{ marginBottom: '6px', display: 'block' }}>
              Nota de preparación (opcional)
            </label>
            <input
              id="ready-note-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Verificado control de calidad 100%"
              value={readyNote}
              onChange={e => setReadyNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL 4: DESPACHO Y LOGÍSTICA (Preparado / En preparación ➔ Enviado) ── */}
      <Modal
        open={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={`Despachar Pedido #${formatOrderCode(order.id)}`}
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleExecuteDispatch}
              disabled={statusLoading}
            >
              {statusLoading ? 'Despachando...' : '🚚 Confirmar Despacho'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setDispatchModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          <div>
            <label className={styles.detailSectionTitle} htmlFor="dispatch-carrier-select" style={{ marginBottom: '6px', display: 'block' }}>
              Empresa de Logística / Medio de Envío *
            </label>
            <Dropdown
              id="dispatch-carrier-select"
              options={CARRIER_OPTIONS}
              value={dispatchCarrier}
              onChange={setDispatchCarrier}
              placeholder="Seleccionar medio..."
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="dispatch-tracking-input" style={{ marginBottom: '6px', display: 'block' }}>
              N° de Seguimiento / Guía
            </label>
            <input
              id="dispatch-tracking-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: OCA-98410294 / Flete #12"
              value={dispatchTracking}
              onChange={e => setDispatchTracking(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="dispatch-note-input" style={{ marginBottom: '6px', display: 'block' }}>
              Nota de envío (opcional)
            </label>
            <input
              id="dispatch-note-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Entregado a chofer de reparto turno tarde"
              value={dispatchNote}
              onChange={e => setDispatchNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL 5: ENTREGA FINAL Y COBRO CONTRA ENTREGA (Enviado / Preparado ➔ Entregado) ── */}
      <Modal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        title={`Finalizar y Entregar Pedido #${formatOrderCode(order.id)}`}
        size="md"
        actions={
          <>
            <button
              type="button"
              className={styles.applyStatusBtn}
              onClick={handleExecuteDelivery}
              disabled={statusLoading}
            >
              {statusLoading ? 'Finalizando...' : '✅ Marcar como Entregado y Finalizar'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setDeliveryModalOpen(false)}
              disabled={statusLoading}
            >
              Cancelar
            </button>
          </>
        }
      >
        <div className="guidedModalForm">
          {!isAbonado && (
            <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '10px', border: '1px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="delivery-collect-cash-check"
                  type="checkbox"
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                  checked={deliveryCollectCash}
                  onChange={e => setDeliveryCollectCash(e.target.checked)}
                />
                <label htmlFor="delivery-collect-cash-check" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block' }}>
                    Registrar cobro de {formatPrice(remainingAmount)} en efectivo / contra entrega
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Al marcar esta casilla, el pedido pasará automáticamente a estado "Abonado".
                  </span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className={styles.detailSectionTitle} htmlFor="delivery-receiver-input" style={{ marginBottom: '6px', display: 'block' }}>
              Receptor / DNI (opcional)
            </label>
            <input
              id="delivery-receiver-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Recibió Darío Gimenez (DNI 38.941.200)"
              value={deliveryReceiver}
              onChange={e => setDeliveryReceiver(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.detailSectionTitle} htmlFor="delivery-note-input" style={{ marginBottom: '6px', display: 'block' }}>
              Nota de conformidad (opcional)
            </label>
            <input
              id="delivery-note-input"
              type="text"
              className={styles.statusNoteInput}
              placeholder="Ej: Bulto entregado en perfectas condiciones"
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};