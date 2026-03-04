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

// Mapeo detallado: keywords del NOMBRE del producto → foto específica de Unsplash
// Cubre ~150 combinaciones para que cada tipo de producto tenga su propia imagen
const PRODUCT_IMAGE_MAP: Array<{ keywords: string[]; all?: boolean; url: string }> = [
  // ── ACEITES ──────────────────────────────────────────────────────────────
  { keywords: ['aceite', 'coco'],          url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop' },
  { keywords: ['aceite', 'oliva'],         url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop' },
  { keywords: ['aceite', 'lino'],          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  { keywords: ['aceite', 'sesamo'],        url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop' },
  { keywords: ['aceite', 'palta'],         url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop' },
  { keywords: ['aceite', 'girasol'],       url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  { keywords: ['ghee'],                    url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop' },
  { keywords: ['vinagre', 'manzana'],      url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&auto=format&fit=crop' },
  { keywords: ['vinagre'],                 url: 'https://images.unsplash.com/photo-1562547256-2c5ee93714bc?w=800&auto=format&fit=crop' },
  { keywords: ['aceto', 'balsamico'],      url: 'https://images.unsplash.com/photo-1562547256-2c5ee93714bc?w=800&auto=format&fit=crop' },
  { keywords: ['mayonesa'],                url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop' },
  { keywords: ['mostaza'],                 url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop' },
  { keywords: ['ketchup'],                 url: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=800&auto=format&fit=crop' },
  { keywords: ['salsa', 'soja'],           url: 'https://images.unsplash.com/photo-1569929207073-3e6cb4e62cfe?w=800&auto=format&fit=crop' },
  { keywords: ['chimichurri'],             url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop' },
  { keywords: ['hummus'],                  url: 'https://images.unsplash.com/photo-1542124948-dc391252a940?w=800&auto=format&fit=crop' },
  { keywords: ['tahini'],                  url: 'https://images.unsplash.com/photo-1542124948-dc391252a940?w=800&auto=format&fit=crop' },
  // ── FRUTOS SECOS ──────────────────────────────────────────────────────────
  { keywords: ['almendra'],               url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&auto=format&fit=crop' },
  { keywords: ['nuez', 'pecan'],          url: 'https://images.unsplash.com/photo-1599598425947-330026216d05?w=800&auto=format&fit=crop' },
  { keywords: ['nuez'],                   url: 'https://images.unsplash.com/photo-1599598425947-330026216d05?w=800&auto=format&fit=crop' },
  { keywords: ['mani'],                   url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&auto=format&fit=crop' },
  { keywords: ['pasta', 'mani'],          url: 'https://images.unsplash.com/photo-1584836659841-42415cd2a918?w=800&auto=format&fit=crop' },
  { keywords: ['mantequilla', 'mani'],    url: 'https://images.unsplash.com/photo-1584836659841-42415cd2a918?w=800&auto=format&fit=crop' },
  { keywords: ['castana', 'caju'],        url: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=800&auto=format&fit=crop' },
  { keywords: ['pistacho'],              url: 'https://images.unsplash.com/photo-1625869579807-c7a6e7a2dc9d?w=800&auto=format&fit=crop' },
  { keywords: ['avellana'],              url: 'https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=800&auto=format&fit=crop' },
  { keywords: ['mix', 'frutos'],         url: 'https://images.unsplash.com/photo-1600189020440-be1b0ee43a6e?w=800&auto=format&fit=crop' },
  // ── SEMILLAS ──────────────────────────────────────────────────────────────
  { keywords: ['chia'],                   url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop' },
  { keywords: ['lino'],                   url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop' },
  { keywords: ['sesamo'],                 url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop' },
  { keywords: ['girasol', 'semilla'],     url: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b01c?w=800&auto=format&fit=crop' },
  { keywords: ['zapallo', 'semilla'],     url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop' },
  { keywords: ['semilla'],               url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop' },
  // ── CEREALES Y AVENA ──────────────────────────────────────────────────────
  { keywords: ['avena'],                  url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop' },
  { keywords: ['granola'],               url: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&auto=format&fit=crop' },
  { keywords: ['quinoa'],                url: 'https://images.unsplash.com/photo-1560806175-9cb0d27b7d5a?w=800&auto=format&fit=crop' },
  { keywords: ['arroz'],                 url: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&auto=format&fit=crop' },
  { keywords: ['amaranto'],              url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop' },
  { keywords: ['copos', 'maiz'],         url: 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=800&auto=format&fit=crop' },
  { keywords: ['cereal'],                url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop' },
  // ── LEGUMBRES ─────────────────────────────────────────────────────────────
  { keywords: ['lenteja'],               url: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=800&auto=format&fit=crop' },
  { keywords: ['garbanzo'],              url: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=800&auto=format&fit=crop' },
  { keywords: ['porotos', 'poroto'],     url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop' },
  { keywords: ['soja', 'texturizada'],   url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop' },
  // ── HARINAS Y PREMEZCLAS ──────────────────────────────────────────────────
  { keywords: ['harina', 'almendra'],    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop' },
  { keywords: ['harina', 'coco'],        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop' },
  { keywords: ['harina', 'arroz'],       url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  { keywords: ['harina'],               url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  { keywords: ['premezcla'],            url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop' },
  { keywords: ['fecula'],               url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  // ── PASTAS ────────────────────────────────────────────────────────────────
  { keywords: ['pasta', 'mani'],        url: 'https://images.unsplash.com/photo-1584836659841-42415cd2a918?w=800&auto=format&fit=crop' },
  { keywords: ['fideos'],               url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop' },
  { keywords: ['pasta'],                url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop' },
  { keywords: ['espagueti', 'spaghetti'], url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop' },
  // ── DULCES Y MERMELADAS ───────────────────────────────────────────────────
  { keywords: ['mermelada', 'frutilla'], url: 'https://images.unsplash.com/photo-1562181732-5b0e94d2c5da?w=800&auto=format&fit=crop' },
  { keywords: ['mermelada'],            url: 'https://images.unsplash.com/photo-1562181732-5b0e94d2c5da?w=800&auto=format&fit=crop' },
  { keywords: ['dulce', 'leche'],        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  { keywords: ['dulce'],                url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  // ── CHOCOLATE Y CACAO ─────────────────────────────────────────────────────
  { keywords: ['cacao'],                url: 'https://images.unsplash.com/photo-1606312619070-d48b5c7a77f5?w=800&auto=format&fit=crop' },
  { keywords: ['chocolate', 'blanco'],  url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&auto=format&fit=crop' },
  { keywords: ['chocolate', 'amargo'],  url: 'https://images.unsplash.com/photo-1606312619070-d48b5c7a77f5?w=800&auto=format&fit=crop' },
  { keywords: ['chocolate'],            url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&auto=format&fit=crop' },
  { keywords: ['tableta'],              url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&auto=format&fit=crop' },
  // ── GOLOSINAS Y ALFAJORES ─────────────────────────────────────────────────
  { keywords: ['alfajor'],              url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['barrita'],              url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop' },
  { keywords: ['chupete'],              url: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=800&auto=format&fit=crop' },
  { keywords: ['gomita'],               url: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=800&auto=format&fit=crop' },
  // ── GALLETITAS Y SNACKS ───────────────────────────────────────────────────
  { keywords: ['galletita', 'arroz'],   url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['galletita'],            url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['tostada'],              url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['grisines'],             url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['chips'],                url: 'https://images.unsplash.com/photo-1607013407627-6352b8ec4804?w=800&auto=format&fit=crop' },
  { keywords: ['pop corn', 'pochoclo'], url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop' },
  { keywords: ['snack'],                url: 'https://images.unsplash.com/photo-1607013407627-6352b8ec4804?w=800&auto=format&fit=crop' },
  // ── MIEL Y ENDULZANTES ────────────────────────────────────────────────────
  { keywords: ['miel'],                 url: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?w=800&auto=format&fit=crop' },
  { keywords: ['stevia'],               url: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?w=800&auto=format&fit=crop' },
  { keywords: ['azucar', 'coco'],       url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop' },
  { keywords: ['azucar'],               url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop' },
  { keywords: ['edulcorante'],          url: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?w=800&auto=format&fit=crop' },
  { keywords: ['agave'],                url: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?w=800&auto=format&fit=crop' },
  // ── INFUSIONES Y CAFÉ ─────────────────────────────────────────────────────
  { keywords: ['yerba'],                url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  { keywords: ['te verde'],             url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop' },
  { keywords: ['te negro'],             url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  { keywords: ['te', 'boldo'],          url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  { keywords: ['manzanilla'],           url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  { keywords: ['cafe'],                 url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop' },
  { keywords: ['matcha'],               url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop' },
  { keywords: ['kombucha'],             url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop' },
  { keywords: ['infusion'],             url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { keywords: ['cerveza'],              url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&auto=format&fit=crop' },
  { keywords: ['vino'],                 url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop' },
  { keywords: ['jugo', 'arandano'],     url: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&auto=format&fit=crop' },
  { keywords: ['jugo'],                 url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop' },
  { keywords: ['leche', 'coco'],        url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop' },
  { keywords: ['leche', 'almendra'],    url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop' },
  { keywords: ['leche', 'avena'],       url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop' },
  { keywords: ['leche'],                url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop' },
  { keywords: ['gaseosa'],              url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&auto=format&fit=crop' },
  { keywords: ['agua'],                 url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&auto=format&fit=crop' },
  // ── ESPECIAS Y SAL ────────────────────────────────────────────────────────
  { keywords: ['curcuma'],              url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop' },
  { keywords: ['canela'],               url: 'https://images.unsplash.com/photo-1589671904193-7e1c79e3b0e3?w=800&auto=format&fit=crop' },
  { keywords: ['jengibre'],             url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop' },
  { keywords: ['pimienta'],             url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop' },
  { keywords: ['sal', 'himalaya'],      url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop' },
  { keywords: ['sal'],                  url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop' },
  { keywords: ['especia'],              url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop' },
  // ── FRUTAS DESHIDRATADAS ──────────────────────────────────────────────────
  { keywords: ['arandano', 'deshidratado'], url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop' },
  { keywords: ['dátil', 'datil'],       url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop' },
  { keywords: ['mango', 'deshidratado'], url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop' },
  { keywords: ['fruta', 'deshidratada'], url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop' },
  { keywords: ['pasa', 'uva'],          url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop' },
  // ── COLÁGENO Y SUPLEMENTOS ────────────────────────────────────────────────
  { keywords: ['colageno'],             url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop' },
  { keywords: ['magnesio'],             url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop' },
  { keywords: ['calcio'],               url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop' },
  { keywords: ['vitamina'],             url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop' },
  { keywords: ['omega'],                url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop' },
  { keywords: ['proteina'],             url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop' },
  { keywords: ['probiotico'],           url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop' },
  { keywords: ['capsula'],              url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop' },
  { keywords: ['tintura'],              url: 'https://images.unsplash.com/photo-1564671546-5b2e1e5b9e94?w=800&auto=format&fit=crop' },
  { keywords: ['aloe'],                 url: 'https://images.unsplash.com/photo-1564671546-5b2e1e5b9e94?w=800&auto=format&fit=crop' },
  { keywords: ['spirulina'],            url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop' },
  { keywords: ['ginkgo'],               url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop' },
  // ── REPOSTERÍA ────────────────────────────────────────────────────────────
  { keywords: ['levadura'],             url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  { keywords: ['coco', 'rallado'],      url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop' },
  { keywords: ['chips', 'chocolate'],   url: 'https://images.unsplash.com/photo-1606312619070-d48b5c7a77f5?w=800&auto=format&fit=crop' },
  { keywords: ['vainilla'],             url: 'https://images.unsplash.com/photo-1589671904193-7e1c79e3b0e3?w=800&auto=format&fit=crop' },
  { keywords: ['polvo', 'hornear'],     url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
];

// Fallback por categoría
const CATEGORY_FALLBACK: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['aceite', 'vinagre', 'salsa'],      url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop' },
  { keywords: ['avena', 'cereal', 'granola', 'soja'], url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop' },
  { keywords: ['bebida', 'jugo'],                  url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop' },
  { keywords: ['fruta', 'deshidratada'],           url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop' },
  { keywords: ['fruto', 'seco'],                   url: 'https://images.unsplash.com/photo-1600189020440-be1b0ee43a6e?w=800&auto=format&fit=crop' },
  { keywords: ['miel', 'endulzante'],              url: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?w=800&auto=format&fit=crop' },
  { keywords: ['especia', 'sal'],                  url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop' },
  { keywords: ['legumbre', 'semilla'],             url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop' },
  { keywords: ['galletita', 'snack', 'tostada'],   url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop' },
  { keywords: ['infusion', 'mate', 'cafe'],        url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop' },
  { keywords: ['harina', 'fecula', 'premezcla'],   url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  { keywords: ['pasta', 'fideo'],                  url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop' },
  { keywords: ['chocolate', 'golosina', 'dulce'],  url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&auto=format&fit=crop' },
  { keywords: ['complemento', 'suplemento', 'herboristeria'], url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop' },
  { keywords: ['reposteria'],                      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop' },
  { keywords: ['vegano', 'vegetariano'],            url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop' },
];

const getProductImage = (name: string, category: string): string => {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const c = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Buscar por keywords del NOMBRE (más específico)
  for (const entry of PRODUCT_IMAGE_MAP) {
    if (entry.keywords.every(kw => n.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return entry.url;
    }
  }
  // 2. Fallback por CATEGORÍA
  for (const entry of CATEGORY_FALLBACK) {
    if (entry.keywords.some(kw => c.includes(kw))) return entry.url;
  }
  // 3. Default
  return 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop';
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
        if (!imageUrl || imageUrl.includes('1505253758473')) imageUrl = getProductImage(name, category);

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