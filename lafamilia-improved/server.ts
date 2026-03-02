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

// --- 1. BASE DE DATOS POSTGRESQL (Solo para guardar PEDIDOS) ---
// Si no pusiste tu link de Neon todavía, pondrá uno genérico para que no explote.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://usuario:contraseña@localhost:5432/dietetica',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
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
    console.log('✅ Base de datos PostgreSQL de pedidos lista');
  } catch (error) {
    console.log('⚠️ Base de datos de pedidos no conectada. (Aún no configuraste Neon.tech)');
  }
};
initDB();

// --- 2. LECTOR MÁGICO DE EXCEL / CSV (Para PRODUCTOS) ---
// Si este texto empieza con http, lo descarga de internet (Google Sheets). 
// Si no, lee el archivo local que me pasaste.
const GOOGLE_SHEETS_CSV_URL = process.env.SHEET_URL || 'lista de precios dietetica  - Hoja 1.csv';

let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getProducts() {
  const CACHE_MINUTES = 5; // Refresca los precios cada 5 minutos
  const now = Date.now();
  
  if (cachedProducts.length > 0 && (now - lastFetchTime) < CACHE_MINUTES * 60 * 1000) {
    return cachedProducts;
  }

  try {
    let csvText = '';
    if (GOOGLE_SHEETS_CSV_URL.startsWith('http')) {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) throw new Error('No se pudo descargar el Excel de Google');
      csvText = await response.text();
    } else {
      csvText = fs.readFileSync(GOOGLE_SHEETS_CSV_URL, 'utf-8');
    }

    const lines = csvText.split(/\r?\n/);
    const products = [];
    let currentCategory = 'General';

    for (let line of lines) {
      // Separa por comas ignorando las comas que están dentro de comillas
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
      if (cols.length < 3) continue;

      const col0 = cols[0]; // Ej: "1 - ACEITES, VINAGRES Y SALSAS"
      const col1 = cols[1]; // Ej: "aceite de coco GB 125ml neutro"
      const col2 = cols[2]; // Ej: "$5.500"

      // Detecta si es un título de Categoría
      if (col0 && col0.match(/^\d+\s*-/)) {
        currentCategory = col0.replace(/^\d+\s*-\s*/, '').trim();
        continue;
      }

      // Detecta si es un Producto con precio
      if (col1 && col2 && col2.startsWith('$')) {
        const priceStr = col2.replace('$', '').replace(/\./g, '').replace(',', '.').trim();
        const price = parseFloat(priceStr);

        if (!isNaN(price) && price > 0) {
          // Generamos un ID seguro y sin espacios
          const cleanId = col1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
          
          products.push({
            id: cleanId,
            name: col1,
            description: '', // Tu Excel no tiene descripción, lo dejamos vacío
            price: price,
            imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=800', // Imagen genérica bonita
            inStock: true,
            characteristics: [],
            category: currentCategory
          });
        }
      }
    }
    
    cachedProducts = products;
    lastFetchTime = now;
    console.log(`✅ ${products.length} productos cargados desde el Excel.`);
    return products;
  } catch (error) {
    console.error('Error leyendo los productos:', error);
    return cachedProducts; // Si falla la lectura, devuelve los últimos conocidos
  }
}

// --- 3. RUTAS DE LA API ---

app.get('/api/products', async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, deliveryMethod, paymentMethod } = req.body;
    let subtotal = 0;
    const allProducts = await getProducts();
    
    // Recalcular total verificando los precios reales del Excel (¡SEGURIDAD!)
    for (const item of items) {
      const realProduct = allProducts.find(p => p.id === item.product.id);
      const precioReal = realProduct ? realProduct.price : 0;
      subtotal += precioReal * item.quantity;
    }

    const shippingCost = deliveryMethod === 'delivery' ? 2500 : 0;
    const discount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0;
    const finalTotal = subtotal + shippingCost - discount;
    const orderNumber = '#LF-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    // Intentamos guardar en PostgreSQL
    await pool.query(
      'INSERT INTO orders (order_number, total, items, customer_info) VALUES ($1, $2, $3, $4)',
      [orderNumber, finalTotal, JSON.stringify(items), JSON.stringify(customerInfo)]
    );

    res.json({ success: true, orderNumber });
  } catch (error) {
    console.error('Error procesando pedido:', error);
    res.status(500).json({ success: false, error: 'Hubo un error al guardar el pedido. (Asegurate de tener configurado Neon PostgreSQL)' });
  }
});

// Rutas del Admin
const ADMIN_PASSWORD = 'lafamilia2024';
const ADMIN_TOKEN = 'lf-token-seguro-789';

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === ADMIN_TOKEN) next();
  else res.status(401).json({ error: 'Acceso no autorizado' });
};

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ success: true, token: ADMIN_TOKEN });
  else res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Base de datos no conectada' });
  }
});

app.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando estado' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en el puerto ${PORT}`);
});