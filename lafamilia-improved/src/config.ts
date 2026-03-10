// =============================================================
// Configuración centralizada del frontend
// =============================================================

// URL base de la API para PEDIDOS y ADMIN (Render backend).
// - En desarrollo: vacío ('') → Vite proxy redirige /api → localhost:3001
// - En producción: configurar VITE_API_URL en Netlify → tu URL de Render
// NOTA: /api/products NO usa esta variable → va a la Netlify Function
//       que lee Google Sheets directamente.
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

// Número de WhatsApp de La Familia Dietética (formato internacional sin +)
export const WHATSAPP_NUMBER = '5492284638849';

// Costo de envío a domicilio en pesos
export const SHIPPING_COST = 2500;

// Monto mínimo de compra para envío gratis
export const FREE_SHIPPING_THRESHOLD = 20000;
