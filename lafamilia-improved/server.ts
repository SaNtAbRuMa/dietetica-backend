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

// --- BASE DE DATOS POSTGRESQL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://usuario:contraseña@localhost:5432/dietetica',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// --- FUNCIÓN MÁGICA DE IMÁGENES ---
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
  
  // Imagen por defecto si no coincide con nada
  return 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=800'; 
};

// --- LECTOR OPTIMIZADO DE CSV ---
const GOOGLE_SHEETS_CSV_URL = process.env.SHEET_URL || 'productos_optimizados.csv';

let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getProducts() {
  const CACHE_MINUTES = 5;
  const now = Date.now();
  
  if (cachedProducts.length > 0 && (now - lastFetchTime) < CACHE_MINUTES * 60 * 1000) {
    return cachedProducts;
  }

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
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
      
      if (cols.length >= 7) {
        const id = cols[0];
        const name = cols[1];
        const description = cols[2];
        const price = parseFloat(cols[3]);
        const inStock = cols[5].toLowerCase() === 'si';
        const category = cols[6] || 'General';
        const chars = cols[7] ? cols[7].split(',').map(c => c.trim()).filter(c => c) : [];
        
        // Asigna la foto dinámica según la categoría (Si el Excel trajera un link en cols[4] usaría ese)
        const imageUrl = cols[4] || getCategoryImage(category);

        if (id && name && !isNaN(price)) {
          products.push({ id, name, description, price, imageUrl, inStock, characteristics: chars, category });
        }
      }
    }
    
    cachedProducts = products;
    lastFetchTime = now;
    return products;
  } catch (error) {
    return cachedProducts;
  }
}

// --- RUTAS API ---
app.get('/api/products', async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, deliveryMethod, paymentMethod } = req.body;
    let subtotal = 0;
    const allProducts = await getProducts();
    for (const item of items) {
      const realProduct = allProducts.find(p => p.id === item.product.id);
      if(realProduct) subtotal += realProduct.price * item.quantity;
    }
    const finalTotal = subtotal + (deliveryMethod === 'delivery' ? 2500 : 0) - (paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0);
    const orderNumber = '#LF-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    await pool.query('INSERT INTO orders (order_number, total, items, customer_info) VALUES ($1, $2, $3, $4)', [orderNumber, finalTotal, JSON.stringify(items), JSON.stringify(customerInfo)]);
    res.json({ success: true, orderNumber });
  } catch (error) { res.status(500).json({ success: false }); }
});

const ADMIN_PASSWORD = 'lafamilia2024';
const ADMIN_TOKEN = 'lf-token-seguro-789';
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers.authorization?.split(' ')[1] === ADMIN_TOKEN) next(); else res.status(401).json({ error: 'No autorizado' });
};
app.post('/api/admin/login', (req, res) => req.body.password === ADMIN_PASSWORD ? res.json({ success: true, token: ADMIN_TOKEN }) : res.status(401).json({ success: false }));
app.get('/api/orders', requireAuth, async (req, res) => res.json((await pool.query('SELECT * FROM orders ORDER BY created_at DESC')).rows));
app.patch('/api/orders/:id/status', requireAuth, async (req, res) => { await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({ success: true }); });

app.listen(process.env.PORT || 3001, () => console.log('Backend corriendo'));