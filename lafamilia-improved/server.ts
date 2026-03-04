import express from 'express';
import pkg from 'pg';
import fs from 'fs';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const { Pool } = pkg;
const app = express();
app.use(express.json());

// =============================================================
// CORS
// =============================================================
const IS_PRODUCTION  = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (IS_PRODUCTION ? '' : 'http://localhost:3000');

if (IS_PRODUCTION && !process.env.ALLOWED_ORIGIN)
  console.warn('⚠️  ALLOWED_ORIGIN no configurado en producción.');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  } else if (!IS_PRODUCTION && !origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// =============================================================
// Rate limiting login
// =============================================================
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const rateLimitLogin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) return res.status(429).json({ success: false, error: 'Demasiados intentos. Esperá unos minutos.' });
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }
  next();
};

// =============================================================
// Base de datos
// =============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://usuario:contraseña@localhost:5432/dietetica',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// =============================================================
// MercadoPago
// =============================================================
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const mpClient = MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null;
if (!MP_ACCESS_TOKEN) console.warn('⚠️  MP_ACCESS_TOKEN no configurado. MercadoPago deshabilitado.');

// =============================================================
// Admin
// =============================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN    = process.env.ADMIN_TOKEN;
if (!ADMIN_PASSWORD || !ADMIN_TOKEN)
  console.error('⛔ ADMIN_PASSWORD y ADMIN_TOKEN deben estar en variables de entorno.');

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (ADMIN_TOKEN && token === ADMIN_TOKEN) next();
  else res.status(401).json({ error: 'No autorizado' });
};

// =============================================================
// Helpers catálogo
// =============================================================
const capitalizeText = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().split(' ').filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getCategoryImage = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('aceite') || cat.includes('vinagre') || cat.includes('salsa'))
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('avena') || cat.includes('cereal') || cat.includes('granola'))
    return 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('bebida') || cat.includes('jugo'))
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('fruta') && cat.includes('deshidratada'))
    return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('fruto') && cat.includes('seco'))
    return 'https://images.unsplash.com/photo-1599598425947-330026216d05?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('miel') || cat.includes('endulzante'))
    return 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('especia') || cat.includes('sal'))
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('legumbre') || cat.includes('semilla'))
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('galletita') || cat.includes('snack'))
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('infusion') || cat.includes('te') || cat.includes('cafe'))
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('cosmetica'))
    return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('harina') || cat.includes('fecula') || cat.includes('premezcla'))
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('pasta') || cat.includes('fideo'))
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('chocolate') || cat.includes('golosina') || cat.includes('dulce'))
    return 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('complemento') || cat.includes('suplemento'))
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=800';
};

const getAutoCharacteristics = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('tacc') || cat.includes('celiaco'))  return ['Sin TACC', 'Apto Celíacos'];
  if (cat.includes('fruto') || cat.includes('seco'))    return ['Rico en Energía', 'Fuente de Proteína'];
  if (cat.includes('cosmetica'))                        return ['Cuidado Natural', 'Cruelty Free'];
  if (cat.includes('vegan'))                            return ['100% Vegano', 'Plant Based'];
  return ['Calidad Premium', 'Dietética Natural'];
};

// =============================================================
// Catálogo con caché 5 min
// =============================================================
const GOOGLE_SHEETS_CSV_URL = process.env.SHEET_URL || 'productos_optimizados.csv';
let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getProducts() {
  const now = Date.now();
  if (cachedProducts.length > 0 && (now - lastFetchTime) < 5 * 60 * 1000) return cachedProducts;
  try {
    let csvText = '';
    if (GOOGLE_SHEETS_CSV_URL.startsWith('http')) {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) throw new Error('No se pudo descargar el CSV');
      csvText = await response.text();
    } else {
      csvText = fs.readFileSync(GOOGLE_SHEETS_CSV_URL, 'utf-8');
    }
    const lines = csvText.split(/\r?\n/);
    const parsedProducts: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
      if (cols.length >= 7) {
        const id = cols[0], name = capitalizeText(cols[1]), description = capitalizeText(cols[2] || '');
        const price = parseFloat(cols[3]);
        const inStock = cols[5] ? cols[5].toLowerCase() === 'si' : true;
        const category = capitalizeText(cols[6] || 'General');
        let chars = cols[7] ? cols[7].split(',').map(c => capitalizeText(c.trim())).filter(c => c) : [];
        if (chars.length === 0) chars = getAutoCharacteristics(category);
        let imageUrl = cols[4];
        if (!imageUrl || imageUrl.includes('1505253758473')) imageUrl = getCategoryImage(category);
        if (id && name && !isNaN(price))
          parsedProducts.push({ id, name, description, price, imageUrl, inStock, characteristics: chars, category });
      }
    }
    const groupedMap = new Map();
    const sizeRegex = /\b(\d+(?:[.,]\d+)?\s*(?:ml|cc|lt|l|g|gr|kg|cm3|oz))\b/i;
    parsedProducts.forEach(p => {
      const sizeMatch = p.name.match(sizeRegex);
      if (sizeMatch) {
        const baseName = p.name.replace(sizeRegex, '').replace(/\s{2,}/g, ' ').trim();
        const key = `${baseName}-${p.category}`;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, { ...p, name: baseName, variants: [p] });
        } else {
          const group = groupedMap.get(key);
          group.variants.push(p);
          group.variants.sort((a: any, b: any) => a.price - b.price);
          group.price = group.variants[0].price;
        }
      } else {
        groupedMap.set(p.id, p);
      }
    });
    cachedProducts = Array.from(groupedMap.values());
    lastFetchTime = now;
    return cachedProducts;
  } catch (error) {
    return cachedProducts;
  }
}

// =============================================================
// Notificación WhatsApp (no bloqueante)
// =============================================================
async function notifyOwnerWhatsApp(order: {
  orderNumber: string; customerInfo: any; items: any[];
  finalTotal: number; deliveryMethod: string; paymentMethod: string;
}) {
  const ownerNumber = process.env.OWNER_WHATSAPP;
  if (!ownerNumber) return;
  const paymentLabels: Record<string, string> = {
    transfer: 'Transferencia (10% desc.)', mercadopago: 'MercadoPago ✅', cash: 'Efectivo',
  };
  const deliveryLabels: Record<string, string> = { delivery: 'Envío a domicilio', pickup: 'Retiro en local' };
  const itemLines = order.items
    .map((i: any) => `  • ${i.quantity}x ${i.product?.name ?? 'Producto'} → $${(i.product?.price * i.quantity).toLocaleString('es-AR')}`)
    .join('\n');
  const msg = [
    `🛒 *NUEVO PEDIDO ${order.orderNumber}*`,
    `👤 ${order.customerInfo.nombre} | ${order.customerInfo.telefono}`,
    `📦 ${deliveryLabels[order.deliveryMethod] ?? order.deliveryMethod}`,
    order.customerInfo.direccion ? `📍 ${order.customerInfo.direccion}` : null,
    `💳 ${paymentLabels[order.paymentMethod] ?? order.paymentMethod}`,
    ``, itemLines, ``,
    `💰 *Total: $${order.finalTotal.toLocaleString('es-AR')}*`,
  ].filter(Boolean).join('\n');
  const waUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;
  console.log(`📲 Nuevo pedido ${order.orderNumber} — WhatsApp: ${waUrl}`);
}

// =============================================================
// RUTAS — Catálogo
// =============================================================
app.get('/api/products', async (_req, res) => {
  res.json(await getProducts());
});

// =============================================================
// RUTAS — Pedidos
// =============================================================
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, deliveryMethod, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    if (!customerInfo?.nombre || !customerInfo?.telefono)
      return res.status(400).json({ success: false, error: 'Faltan datos del cliente.' });
    if (!['delivery', 'pickup'].includes(deliveryMethod))
      return res.status(400).json({ success: false, error: 'Método de entrega inválido.' });
    if (!['transfer', 'mercadopago', 'cash'].includes(paymentMethod))
      return res.status(400).json({ success: false, error: 'Método de pago inválido.' });

    let subtotal = 0;
    const allProducts = await getProducts();
    for (const item of items) {
      let realProduct = null;
      for (const group of allProducts) {
        if (group.variants) {
          const found = group.variants.find((v: any) => v.id === item.product.id);
          if (found) realProduct = found;
        } else if (group.id === item.product.id) {
          realProduct = group;
        }
      }
      if (realProduct) subtotal += realProduct.price * item.quantity;
    }
    if (subtotal === 0)
      return res.status(400).json({ success: false, error: 'No se encontraron los productos en el catálogo.' });

    const SHIPPING_COST = 2500, FREE_SHIPPING_THRESHOLD = 20000;
    const qualifiesForFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingCost     = (deliveryMethod === 'pickup' || qualifiesForFree) ? 0 : SHIPPING_COST;
    const discount         = paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0;
    const finalTotal       = subtotal + shippingCost - discount;
    const initialStatus    = paymentMethod === 'mercadopago' ? 'pendiente_pago' : 'pendiente';

    const insertResult = await pool.query(
      `INSERT INTO orders (order_number, total, status, items, customer_info, delivery_method, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['TEMP', finalTotal, initialStatus, JSON.stringify(items), JSON.stringify(customerInfo), deliveryMethod, paymentMethod]
    );
    const orderId = insertResult.rows[0].id;
    const orderNumber = '#LF-' + String(orderId).padStart(5, '0');
    await pool.query('UPDATE orders SET order_number = $1 WHERE id = $2', [orderNumber, orderId]);

    if (paymentMethod !== 'mercadopago') {
      notifyOwnerWhatsApp({ orderNumber, customerInfo, items, finalTotal, deliveryMethod, paymentMethod })
        .catch(err => console.warn('⚠️ WhatsApp notify falló:', err));
    }

    res.json({ success: true, orderNumber, orderId, finalTotal });
  } catch (error) {
    console.error('Error en POST /api/orders:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// =============================================================
// RUTAS — MercadoPago
// =============================================================
app.get('/api/mp/status', (_req, res) => res.json({ enabled: !!mpClient }));

app.post('/api/mp/create-preference', async (req, res) => {
  if (!mpClient) return res.status(503).json({ success: false, error: 'MercadoPago no configurado.' });
  const { orderNumber, totalAmount, description } = req.body;
  if (!orderNumber || !totalAmount) return res.status(400).json({ success: false, error: 'Faltan datos.' });
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
    const BACKEND_URL  = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3001}`;
    const prefClient   = new Preference(mpClient);
    const result = await prefClient.create({
      body: {
        items: [{
          id: orderNumber,
          title: description || `Pedido La Familia Dietética ${orderNumber}`,
          quantity: 1,
          unit_price: Math.round(totalAmount),
          currency_id: 'ARS',
        }],
        external_reference: orderNumber,
        back_urls: {
          success: `${FRONTEND_URL}/?mp=success`,
          failure: `${FRONTEND_URL}/?mp=failure`,
          pending: `${FRONTEND_URL}/?mp=pending`,
        },
        auto_return: 'approved',
        notification_url: `${BACKEND_URL}/api/mp/webhook`,
        statement_descriptor: 'LA FAMILIA DIETETICA',
      },
    });
    await pool.query('UPDATE orders SET mp_preference_id = $1 WHERE order_number = $2', [result.id, orderNumber]);
    res.json({ success: true, init_point: result.init_point, preference_id: result.id });
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    res.status(500).json({ success: false, error: 'Error al crear el pago con MercadoPago.' });
  }
});

app.post('/api/mp/webhook', async (req, res) => {
  res.sendStatus(200); // Siempre 200 inmediato
  const { type, data } = req.body;
  if (type !== 'payment' || !data?.id || !mpClient) return;
  try {
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: data.id });
    if (!payment.external_reference) return;
    const orderNumber = payment.external_reference;
    const statusMap: Record<string, string> = {
      approved:   'pagado',
      rejected:   'pago_rechazado',
      in_process: 'pago_pendiente',
    };
    const newStatus = statusMap[payment.status ?? ''];
    if (!newStatus) return;
    await pool.query('UPDATE orders SET status = $1 WHERE order_number = $2', [newStatus, orderNumber]);
    console.log(`✅ MP Webhook: ${orderNumber} → ${newStatus}`);
    if (newStatus === 'pagado') {
      const row = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
      if (row.rows[0]) {
        const o = row.rows[0];
        notifyOwnerWhatsApp({
          orderNumber, customerInfo: o.customer_info, items: o.items,
          finalTotal: parseFloat(o.total), deliveryMethod: o.delivery_method, paymentMethod: 'mercadopago',
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error procesando webhook MP:', err);
  }
});

// =============================================================
// RUTAS — Admin
// =============================================================
app.post('/api/admin/login', rateLimitLogin, (req, res) => {
  if (!ADMIN_PASSWORD || !ADMIN_TOKEN)
    return res.status(503).json({ success: false, error: 'Panel de admin no configurado.' });
  if (req.body.password === ADMIN_PASSWORD) return res.json({ success: true, token: ADMIN_TOKEN });
  return res.status(401).json({ success: false });
});

app.get('/api/orders/stats', requireAuth, async (_req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [total, pending, today, byStatus] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders'),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status IN ('pendiente', 'pendiente_pago', 'confirmado', 'en_camino')"),
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE created_at >= $1', [todayStart]),
      pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC'),
    ]);
    res.json({
      total:    { count: parseInt(total.rows[0].count), revenue: parseFloat(total.rows[0].revenue) },
      pending:  { count: parseInt(pending.rows[0].count) },
      today:    { count: parseInt(today.rows[0].count), revenue: parseFloat(today.rows[0].revenue) },
      byStatus: byStatus.rows,
    });
  } catch (err) {
    console.error('Error stats:', err);
    res.status(500).json({ error: 'Error cargando estadísticas.' });
  }
});

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM orders';
    const params: any[] = [];
    const where: string[] = [];
    if (status && status !== 'todos') { params.push(status); where.push(`status = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(order_number ILIKE $${params.length} OR customer_info->>'nombre' ILIKE $${params.length})`);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY created_at DESC';
    res.json((await pool.query(query, params)).rows);
  } catch (err) {
    console.error('Error /api/orders:', err);
    res.status(500).json({ error: 'Error cargando pedidos.' });
  }
});

app.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
  const valid = ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado', 'pagado', 'pendiente_pago', 'pago_rechazado', 'pago_pendiente'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Estado inválido.' });
  await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3001, () => console.log(`✅ Backend corriendo en puerto ${process.env.PORT || 3001}`));
