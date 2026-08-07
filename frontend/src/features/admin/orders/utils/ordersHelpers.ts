import type { OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';

export const STATUS_LABELS: Record<OrderStatus, string> = {
	pendiente: 'Pendiente',
	confirmado: 'Confirmado',
	'en-preparacion': 'En preparación',
	preparado: 'Preparado',
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
	'pendiente', 'confirmado', 'en-preparacion', 'preparado', 'enviado', 'entregado', 'cancelado',
];

// Matriz de transiciones permitidas según el Happy Path e-commerce
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pendiente: ['confirmado', 'cancelado'],
	confirmado: ['en-preparacion', 'cancelado'],
	'en-preparacion': ['preparado', 'enviado', 'cancelado'],
	preparado: ['enviado', 'entregado', 'cancelado'],
	enviado: ['entregado', 'cancelado'],
	entregado: [], // Estado terminal
	cancelado: [], // Estado terminal
};

// Configuración del botón de Siguiente Paso sugerido
export const NEXT_STEP_CONFIG: Record<
	OrderStatus,
	{ nextStatus: OrderStatus | null; label: string; icon: string }
> = {
	pendiente: { nextStatus: 'confirmado', label: 'Confirmar Pedido', icon: '✓' },
	confirmado: { nextStatus: 'en-preparacion', label: 'Pasar a Embalaje / Preparación', icon: '📦' },
	'en-preparacion': { nextStatus: 'preparado', label: 'Marcar como Bulto Preparado', icon: '🏷️' },
	preparado: { nextStatus: 'enviado', label: 'Despachar / Enviar', icon: '🚚' },
	enviado: { nextStatus: 'entregado', label: 'Marcar como Entregado', icon: '✅' },
	entregado: { nextStatus: null, label: 'Pedido Entregado', icon: '🎉' },
	cancelado: { nextStatus: null, label: 'Pedido Cancelado', icon: '❌' },
};

// Pasos secuenciales del Happy Path
export const HAPPY_PATH_STEPS: OrderStatus[] = [
	'pendiente',
	'confirmado',
	'en-preparacion',
	'preparado',
	'enviado',
	'entregado',
];

export function statusClass(status: OrderStatus, styles: Record<string, string>): string {
	const map: Record<OrderStatus, string> = {
		pendiente: styles.statusPendiente,
		confirmado: styles.statusConfirmado,
		'en-preparacion': styles.statusPreparacion,
		preparado: styles.statusPreparado,
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
	preparado: '📦',
	enviado: '🚚',
	entregado: '✅',
	cancelado: '❌',
};