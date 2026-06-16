/** wa.me deep-link builders (free WhatsApp integration) */
export function waChat(phone: string, message = ''): string {
  const clean = phone.replace(/[^\d]/g, '');
  return 'https://wa.me/' + clean + (message ? '?text=' + encodeURIComponent(message) : '');
}

export function waShare(message: string): string {
  return 'https://wa.me/?text=' + encodeURIComponent(message);
}

export function purchaseUpdateMessage(item: string, status: string, trip: string): string {
  return `WARDANY TRIP — ${trip}\nItem: ${item}\nStatus: ${status}`;
}
