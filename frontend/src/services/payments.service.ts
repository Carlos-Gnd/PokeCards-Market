import { api } from '../lib/api';
import type { CreateOrderResponse, CaptureOrderResponse } from '../types';

export async function createOrder(tcgId: string): Promise<CreateOrderResponse> {
  const { data } = await api.post<CreateOrderResponse>('/payments/create-order', { tcgId });
  return data;
}

export async function captureOrder(paypalOrderId: string): Promise<CaptureOrderResponse> {
  const { data } = await api.post<CaptureOrderResponse>('/payments/capture-order', { paypalOrderId });
  return data;
}

export async function fetchHistory() {
  const { data } = await api.get('/payments/history');
  return data;
}
