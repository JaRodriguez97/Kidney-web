const COLOMBIA_LOCALE = 'es-CO';
const COLOMBIA_TIME_ZONE = 'America/Bogota';

export type ColombiaDateFormat = 'date' | 'time' | 'datetime';

function toDate(value: string | Date): Date | null {
	const parsed = value instanceof Date ? value : new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatColombiaDate(value: string | Date): string {
	const date = toDate(value);
	if (!date) {
		return '-';
	}

	return new Intl.DateTimeFormat(COLOMBIA_LOCALE, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: COLOMBIA_TIME_ZONE,
	}).format(date);
}

export function formatColombiaTime(value: string | Date): string {
	const date = toDate(value);
	if (!date) {
		return '-';
	}

	return new Intl.DateTimeFormat(COLOMBIA_LOCALE, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: COLOMBIA_TIME_ZONE,
	}).format(date);
}

export function formatColombiaDateTime(value: string | Date): string {
	const date = toDate(value);
	if (!date) {
		return '-';
	}

	return new Intl.DateTimeFormat(COLOMBIA_LOCALE, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: COLOMBIA_TIME_ZONE,
	}).format(date);
}

export function formatColombia(
	value: string | Date,
	format: ColombiaDateFormat = 'date',
): string {
	if (format === 'time') {
		return formatColombiaTime(value);
	}

	if (format === 'datetime') {
		return formatColombiaDateTime(value);
	}

	return formatColombiaDate(value);
}

export function getTodayColombiaDateKey(): string {
	return new Intl.DateTimeFormat('sv-SE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: COLOMBIA_TIME_ZONE,
	}).format(new Date());
}

export function toColombiaDateKey(value: string | Date): string {
	const date = toDate(value);
	if (!date) {
		return '';
	}

	return new Intl.DateTimeFormat('sv-SE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: COLOMBIA_TIME_ZONE,
	}).format(date);
}

export function toColombiaMonthKey(value: string | Date): string {
	const dateKey = toColombiaDateKey(value);
	return dateKey ? dateKey.slice(0, 7) : '';
}
