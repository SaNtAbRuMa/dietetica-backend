import express from 'express';
import pkg from 'pg';
import fs from 'fs';

const { Pool } = pkg;
const app = express();

app.use(express.json());

// CORS: en producción solo permite el dominio de Netlify
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Rate limiting simple para el endpoint de login (sin dependencias extra)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const rateLimitLogin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      return res.status(429).json({ success: false, error: 'Demasiados intentos. Esperá unos minutos.' });
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); // ventana de 10 min
  }
  next();
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://usuario:contraseña@localhost:5432/dietetica',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const capitalizeText = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().split(' ').filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getCategoryImage = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('aceite') || cat.includes('vinagre') || cat.includes('salsa')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('avena') || cat.includes('cereal') || cat.includes('granola')) return 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('bebida') || cat.includes('jugo')) return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('fruta') && cat.includes('deshidratada')) return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('fruto') && cat.includes('seco')) return 'https://images.unsplash.com/photo-1599598425947-330026216d05?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('miel') || cat.includes('endulzante')) return 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('especia') || cat.includes('sal')) return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('legumbre') || cat.includes('semilla')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('galletita') || cat.includes('snack')) return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('infusion') || cat.includes('te') || cat.includes('cafe')) return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('cosmetica')) return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('harina') || cat.includes('fecula') || cat.includes('premezcla')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('pasta') || cat.includes('fideo')) return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('chocolate') || cat.includes('golosina') || cat.includes('dulce')) return 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=800';
  if (cat.includes('complemento') || cat.includes('suplemento')) return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=800'; 
};

const getAutoCharacteristics = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('tacc') || cat.includes('celiaco')) return ['Sin TACC', 'Apto Celíacos'];
  if (cat.includes('fruto') || cat.includes('seco')) return ['Rico en Energía', 'Fuente de Proteína'];
  if (cat.includes('cosmetica')) return ['Cuidado Natural', 'Cruelty Free'];
  if (cat.includes('vegan')) return ['100% Vegano', 'Plant Based'];
  return ['Calidad Premium', 'Dietética Natural'];
};

const GOOGLE_SHEETS_CSV_URL = process.env.SHEET_URL || 'productos_optimizados.csv';

let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getProducts() {
  const CACHE_MINUTES = 5;
  const now = Date.now();
  if (cachedProducts.length > 0 && (now - lastFetchTime) < CACHE_MINUTES * 60 * 1000) return cachedProducts;

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
    const parsedProducts = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
      
      if (cols.length >= 7) {
        const id = cols[0];
        const name = capitalizeText(cols[1]); 
        const description = capitalizeText(cols[2] || '');
        const price = parseFloat(cols[3]);
        const inStock = cols[5] ? cols[5].toLowerCase() === 'si' : true;
        const category = capitalizeText(cols[6] || 'General'); 
        
        let chars = cols[7] ? cols[7].split(',').map(c => capitalizeText(c.trim())).filter(c => c) : [];
        if (chars.length === 0) chars = getAutoCharacteristics(category);

        let imageUrl = cols[4];
        if (!imageUrl || imageUrl.includes('1505253758473')) imageUrl = getCategoryImage(category);

        if (id && name && !isNaN(price)) {
          parsedProducts.push({ id, name, description, price, imageUrl, inStock, characteristics: chars, category });
        }
      }
    }

    // --- MAGIA: AGRUPACIÓN POR TAMAÑOS ---
    const groupedMap = new Map();
    // Expresión para encontrar ml, gr, kg, etc.
    const sizeRegex = /\b(\d+(?:[.,]\d+)?\s*(?:ml|cc|lt|l|g|gr|kg|cm3|oz))\b/i;

    parsedProducts.forEach(p => {
      const sizeMatch = p.name.match(sizeRegex);
      
      if (sizeMatch) {
        // Le sacamos el tamaño al nombre base (ej: queda "Aceite De Coco Gb Neutro")
        const baseName = p.name.replace(sizeRegex, '').replace(/\s{2,}/g, ' ').trim();
        const key = `${baseName}-${p.category}`;
        
        if (!groupedMap.has(key)) {
          // Es el primero, creamos el grupo
          groupedMap.set(key, { ...p, name: baseName, variants: [p] });
        } else {
          // Ya existe, lo agregamos como variante
          const group = groupedMap.get(key);
          group.variants.push(p);
          group.variants.sort((a: any, b: any) => a.price - b.price); // Ordenar de más barato a caro
          group.price = group.variants[0].price; // Mostrar el precio base
        }
      } else {
        // No tiene tamaño especificado, no se agrupa
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

app.get('/api/products', async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, deliveryMethod, paymentMethod } = req.body;

    // Validación básica de input
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }
    if (!customerInfo?.nombre || !customerInfo?.telefono) {
      return res.status(400).json({ success: false, error: 'Faltan datos del cliente.' });
    }
    if (!['delivery', 'pickup'].includes(deliveryMethod)) {
      return res.status(400).json({ success: false, error: 'Método de entrega inválido.' });
    }

    let subtotal = 0;
    const allProducts = await getProducts();
    for (const item of items) {
      let realProduct = null;
      for (const group of allProducts) {
        if (group.variants) {
          const foundVariant = group.variants.find((v: any) => v.id === item.product.id);
          if (foundVariant) realProduct = foundVariant;
        } else if (group.id === item.product.id) {
          realProduct = group;
        }
      }
      if (realProduct) subtotal += realProduct.price * item.quantity;
    }

    // Bug fix: si ningún producto fue encontrado, rechazar la orden
    if (subtotal === 0) {
      return res.status(400).json({ success: false, error: 'No se encontraron los productos en el catálogo.' });
    }

    const finalTotal = subtotal + (deliveryMethod === 'delivery' ? 2500 : 0) - (paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0);
    const orderNumber = '#LF-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    await pool.query('INSERT INTO orders (order_number, total, items, customer_info) VALUES ($1, $2, $3, $4)', [orderNumber, finalTotal, JSON.stringify(items), JSON.stringify(customerInfo)]);
    res.json({ success: true, orderNumber });
  } catch (error) { res.status(500).json({ success: false, error: 'Error interno del servidor.' }); }
});

const ADMIN_PASSWORD = 'lafamilia2024';
const ADMIN_TOKEN = 'lf-token-seguro-789';
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers.authorization?.split(' ')[1] === ADMIN_TOKEN) next(); else res.status(401).json({ error: 'No autorizado' });
};
app.post('/api/admin/login', rateLimitLogin, (req, res) => req.body.password === ADMIN_PASSWORD ? res.json({ success: true, token: ADMIN_TOKEN }) : res.status(401).json({ success: false }));
app.get('/api/orders', requireAuth, async (req, res) => res.json((await pool.query('SELECT * FROM orders ORDER BY created_at DESC')).rows));
app.patch('/api/orders/:id/status', requireAuth, async (req, res) => { await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({ success: true }); });

app.listen(process.env.PORT || 3001, () => console.log('Backend corriendo'));