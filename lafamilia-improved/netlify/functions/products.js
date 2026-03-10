/**
 * netlify/functions/products.js
 *
 * Función serverless que lee el catálogo desde Google Sheets (publicado como CSV)
 * y lo devuelve como JSON al frontend.
 *
 * CONFIGURACIÓN EN NETLIFY:
 *   Site settings → Environment variables → Add variable:
 *   SHEET_CSV_URL = https://docs.google.com/spreadsheets/d/TU_ID/pub?output=csv
 *
 * CÓMO OBTENER LA URL DEL SHEET:
 *   1. Abrí el Google Sheet con el catálogo
 *   2. Archivo → Compartir → Publicar en la web
 *   3. Elegí la hoja correcta y formato "Valores separados por comas (.csv)"
 *   4. Hacé clic en "Publicar" y copiá la URL generada
 *   5. Pegala en la variable SHEET_CSV_URL de Netlify
 */

const https = require('https');
const http = require('http');

const SHEET_CSV_URL = process.env.SHEET_CSV_URL || '';

// ─── Capitaliza texto: "ACEITE DE COCO" → "Aceite De Coco" ───────────────────
function capitalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ─── Parser de una línea CSV respetando campos entre comillas ─────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      // Comilla escapada dentro de campo citado
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Parsea el CSV completo y devuelve array de Product ──────────────────────
function parseCSVToProducts(csvText) {
  // Normalizar saltos de línea (Windows \r\n → \n)
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });

    // Saltar filas sin id o nombre (pueden ser filas vacías o de encabezado extra)
    if (!row.id && !row.nombre) continue;

    // Precio: limpiar puntos de miles y convertir a número
    const rawPrice = (row.precio || '0').replace(/\./g, '').replace(',', '.');
    const price = parseInt(rawPrice, 10) || 0;

    // Stock: "si", "sí", "true", "1" → true; cualquier otra cosa → false
    const stockValue = (row.stock || 'si').toLowerCase().trim();
    const inStock = ['si', 'sí', 'true', '1', 'yes'].includes(stockValue);

    // Características: separadas por "|" en el sheet (ej: "Sin TACC|Vegano|Orgánico")
    const characteristics = row.caracteristicas
      ? row.caracteristicas.split('|').map(c => c.trim()).filter(Boolean)
      : [];

    products.push({
      id: row.id || String(i),
      name: capitalizeText(row.nombre || ''),
      description: row.descripcion || '',
      price,
      imageUrl: row.imagen || '',
      inStock,
      category: row.categoria ? capitalizeText(row.categoria) : 'General',
      characteristics,
    });
  }

  return products;
}

// ─── Fetch con soporte de redirecciones (Google Sheets redirige) ──────────────
function fetchWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      return reject(new Error('Demasiadas redirecciones'));
    }

    const client = url.startsWith('https://') ? https : http;

    client
      .get(url, (res) => {
        // Seguir redirección 301/302
        if (
          (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) &&
          res.headers.location
        ) {
          return fetchWithRedirects(res.headers.location, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} al obtener el Sheet`));
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

// ─── Handler principal ────────────────────────────────────────────────────────
exports.handler = async function (event, context) {
  // Solo GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!SHEET_CSV_URL) {
    console.error('SHEET_CSV_URL no está configurada en las variables de entorno de Netlify');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'El catálogo no está configurado. Configurá SHEET_CSV_URL en Netlify.',
      }),
    };
  }

  try {
    const csvText = await fetchWithRedirects(SHEET_CSV_URL);
    const products = parseCSVToProducts(csvText);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache de 5 minutos: los cambios en el Sheet se verán en máximo 5 min
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(products),
    };
  } catch (err) {
    console.error('Error al leer el Google Sheet:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `No se pudo leer el catálogo: ${err.message}` }),
    };
  }
};
