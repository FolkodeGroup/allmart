
import type { OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';

export const STATUS_LABELS: Record<OrderStatus, string> = {
	pendiente: 'Pendiente',
	confirmado: 'Confirmado',
	'en-preparacion': 'En preparación',
	enviado: 'Enviado',
	entregado: 'Entregado',
	cancelado: 'Cancelado',
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
	'no-abonado': 'Sin abonar',
	'abonado': 'Abonado',
};

export function paymentClass(status: PaymentStatus, styles: Record<string, string>): string {
	return status === 'abonado' ? styles.paymentAbonado : styles.paymentNoAbonado;
}

export const STATUS_OPTIONS: OrderStatus[] = [
	'pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado',
];

export function statusClass(status: OrderStatus, styles: Record<string, string>): string {
	const map: Record<OrderStatus, string> = {
		pendiente: styles.statusPendiente,
		confirmado: styles.statusConfirmado,
		'en-preparacion': styles.statusPreparacion,
		enviado: styles.statusEnviado,
		entregado: styles.statusEntregado,
		cancelado: styles.statusCancelado,
	};
	return map[status];
}

export function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleString('es-AR', {
		day: '2-digit', month: 'short', year: 'numeric',
		hour: '2-digit', minute: '2-digit',
	});
}

export function formatPrice(n: number): string {
	return new Intl.NumberFormat('es-AR', {
		style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
	}).format(n);
}

export const STATUS_ICONS: Record<OrderStatus, string> = {
	pendiente: '⏳',
	confirmado: '✔️',
	'en-preparacion': '🔧',
	enviado: '🚚',
	entregado: '✅',
	cancelado: '❌',
};
