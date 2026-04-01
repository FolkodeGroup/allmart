export function getLocaleDateKey(date: Date): string {
    return formatDateLocal(date);
}

// -----------------------------
// Date utilities (local date, no UTC surprises)
// Colocar fuera del componente
// -----------------------------
function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

// Devuelve YYYY-MM-DD usando la fecha local
export function formatDateLocal(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parsear string YYYY-MM-DD como inicio del día local (00:00:00.000)
export function parseDateStartLocal(dateStr: string): number {
    const [y, m, day] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, day, 0, 0, 0, 0).getTime();
}

export function parseLocalDate(dateStr: string, endOfDay = false) {
    const [y, m, d] = dateStr.split('-').map(Number);

    if (endOfDay) {
        return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    }

    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

// Parsear string YYYY-MM-DD como fin del día local (23:59:59.999)
export function parseDateEndLocal(dateStr: string): number {
    const [y, m, day] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, day, 23, 59, 59, 999).getTime();
}

// Normalizar createdAt string a ms. Si createdAt es YYYY-MM-DD lo trata como local.
// Si es ISO con hora, lo parsea normalmente.
export function createdAtToMs(createdAt: string): number {
    // Caso: YYYY-MM-DD (sin hora) → LOCAL REAL
    if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
        const [y, m, d] = createdAt.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
    }

    // Caso: ISO completo
    const date = new Date(createdAt);

    if (isNaN(date.getTime())) {
        return 0;
    }

    return date.getTime();
}

// Genera la key de día YYYY-MM-DD basada en timestamp local
export function getDayKeyLocalFromMs(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}