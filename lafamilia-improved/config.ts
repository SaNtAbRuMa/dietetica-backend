// =============================================================
// Configuración centralizada del frontend
// =============================================================

// URL base de la API.
// - En desarrollo: vacío ('') → Vite proxy redirige /api → localhost:3001
// - En producción: configurar VITE_API_URL en .env (ej: https://dietetica-backend.onrender.com)
export const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? '';

// Número de WhatsApp de La Familia Dietética (formato internacional sin +)
// Fuente: lista de precios → "Pedidos a whatsapp 2284-638849"
export const WHATSAPP_NUMBER = '5492284638849';

// Costo de envío a domicilio en pesos
export const SHIPPING_COST = 2500;

// Monto mínimo de compra para envío gratis (según lista de precios)
export const FREE_SHIPPING_THRESHOLD = 20000;
