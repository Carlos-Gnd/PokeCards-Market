import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export function pluralize(n: number, sing: string, plur: string): string {
  return n === 1 ? sing : plur;
}
