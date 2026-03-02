import 'dotenv/config';
import express from 'express';
import pkg from 'pg';
import fs from 'fs';

const { Pool } = pkg;
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// =============================================================
// 1. BASE DE DATOS POSTGRESQL (solo para guardar PEDIDOS)
// =============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const initDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL no configurada. Los pedidos no se guardarán en la base de datos.');
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE,
        total REAL,
        status TEXT DEFAULT 'Pendiente',
        items JSON,
        customer_info JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Base de datos PostgreSQL lista.');
  } catch (error) {
    console.log('⚠️  No se pudo conectar a PostgreSQL:', (error as Error).message);
  }
};
initDB();

// =============================================================
// 2. LECTOR DE LISTA DE PRECIOS (CSV local o Google Sheets)
// =============================================================
// Configurá SHEET_URL en .env:
//   - URL de Google Sheets publicada como CSV
//   - O ruta al archivo CSV local (por defecto: el archivo incluido en el proyecto)
const SHEET_URL = process.env.SHEET_URL || 'lista_de_precios_dietetica__-_Hoja_1.csv';

// Costo de envío y umbral de envío gratuito (en pesos)
export const SHIPPING_COST = 2500;
export const FREE_SHIPPING_THRESHOLD = 20000;

let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getProducts() {
  const CACHE_MINUTES = 5;
  const now = Date.now();

  if (cachedProducts.length > 0 && now - lastFetchTime < CACHE_MINUTES * 60 * 1000) {
    return cachedProducts;
  }

  try {
    let csvText = '';

    if (SHEET_URL.startsWith('http')) {
      const response = await fetch(SHEET_URL);
      if (!response.ok) throw new Error(`No se pudo descargar el CSV: HTTP ${response.status}`);
      csvText = await response.text();
    } else {
      if (!fs.existsSync(SHEET_URL)) {
        throw new Error(`Archivo CSV no encontrado: "${SHEET_URL}". Revisá la variable SHEET_URL en .env`);
      }
      csvText = fs.readFileSync(SHEET_URL, 'utf-8');
    }

    const lines = csvText.split(/\r?\n/);
    const products: any[] = [];
    const seenIds = new Map<string, number>(); // para evitar IDs duplicados
    let currentCategory = 'General';

    for (const line of lines) {
      // Separar columnas respetando comas dentro de comillas
      const cols = line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((col) => col.replace(/^"|"$/g, '').trim());

      if (cols.length < 3) continue;

      const col0 = cols[0];
      const col1 = cols[1];
      const col2 = cols[2];

      // Ignorar filas con errores de fórmula de Excel
      if (col2 === '#REF!' || col2 === '#VALUE!' || col2 === '#N/A') continue;

      // Detectar título de categoría (ej: "1 - ACEITES, VINAGRES Y SALSAS")
      if (col0 && /^\d+\s*-/.test(col0)) {
        currentCategory = col0.replace(/^\d+\s*-\s*/, '').trim();
        continue;
      }

      // Detectar producto con precio
      if (col1 && col2 && col2.startsWith('$')) {
        const priceStr = col2
          .replace('$', '')
          .replace(/\./g, '')
          .replace(',', '.')
          .trim();
        const price = parseFloat(priceStr);

        if (!isNaN(price) && price > 0) {
          // Generar ID base limpio
          const baseId = col1
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          // Garantizar IDs únicos agregando un sufijo numérico si es necesario
          const count = seenIds.get(baseId) ?? 0;
          seenIds.set(baseId, count + 1);
          const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;

          products.push({
            id: uniqueId,
            name: col1,
            description: '',
            price,
            imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=800',
            inStock: true,
            characteristics: [],
            category: currentCategory,
          });
        }
      }
    }

    cachedProducts = products;
    lastFetchTime = now;
    console.log(`✅ ${products.length} productos cargados desde el CSV.`);
    return products;
  } catch (error) {
    console.error('❌ Error leyendo los productos:', (error as Error).message);
    return cachedProducts; // devuelve el caché anterior si falla
  }
}

// =============================================================
// 3. RUTAS DE LA API
// =============================================================

// GET /api/products — Devuelve todos los productos del CSV
app.get('/api/products', async (_req, res) => {
  const products = await getProducts();
  res.json(products);
});

// GET /api/config — Devuelve configuración útil para el frontend
app.get('/api/config', (_req, res) => {
  res.json({
    shippingCost: SHIPPING_COST,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  });
});

// POST /api/orders — Crea un nuevo pedido
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, deliveryMethod, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'El pedido no tiene productos.' });
    }

    const allProducts = await getProducts();
    let subtotal = 0;

    // Recalcular total con precios reales del CSV (seguridad: evita manipulación del frontend)
    for (const item of items) {
      const realProduct = allProducts.find((p) => p.id === item.product.id);
      if (!realProduct) continue;
      subtotal += realProduct.price * item.quantity;
    }

    // Envío gratis si el pedido supera el umbral
    const shippingCost =
      deliveryMethod === 'delivery' && subtotal < FREE_SHIPPING_THRESHOLD
        ? SHIPPING_COST
        : 0;

    const discount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0;
    const finalTotal = subtotal + shippingCost - discount;

    const orderNumber =
      '#LF-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    if (!process.env.DATABASE_URL) {
      // Sin base de datos: devolvemos éxito igual (el pedido se coordina por WhatsApp)
      console.log(`📦 Nuevo pedido ${orderNumber}: $${finalTotal} (sin DB configurada)`);
      return res.json({ success: true, orderNumber });
    }

    await pool.query(
      'INSERT INTO orders (order_number, total, items, customer_info) VALUES ($1, $2, $3, $4)',
      [orderNumber, finalTotal, JSON.stringify(items), JSON.stringify(customerInfo)]
    );

    res.json({ success: true, orderNumber });
  } catch (error) {
    console.error('❌ Error procesando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Hubo un error al guardar el pedido. Revisá la configuración de la base de datos.',
    });
  }
});

// =============================================================
// 4. RUTAS DEL ADMIN
// =============================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lafamilia2024';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'lf-token-seguro-789';

if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOKEN) {
  console.warn('⚠️  ADMIN_PASSWORD y ADMIN_TOKEN no configurados en .env. Usando valores por defecto (inseguro).');
}

const requireAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === ADMIN_TOKEN) next();
  else res.status(401).json({ error: 'Acceso no autorizado' });
};

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }
});

app.get('/api/orders', requireAuth, async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Base de datos no configurada. Completá DATABASE_URL en .env' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando la base de datos' });
  }
});

app.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Base de datos no configurada' });
  }
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [
      req.body.status,
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando estado' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`   CSV: ${SHEET_URL}`);
  console.log(`   DB:  ${process.env.DATABASE_URL ? '✅ Conectada' : '⚠️  No configurada (pedidos sin persistencia)'}`);
});
