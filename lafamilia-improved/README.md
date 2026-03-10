# La Familia Dietética — Tienda Online

## 🛒 Cómo funciona el catálogo

El catálogo de productos se lee en tiempo real desde **Google Sheets**.  
El dueño puede actualizar precios, agregar o quitar productos simplemente editando el spreadsheet — sin tocar código ni hacer deploys.

---

## ⚙️ Configuración inicial (una sola vez)

### 1. Preparar el Google Sheet

1. Abrí [Google Sheets](https://sheets.google.com) y creá un nuevo spreadsheet
2. Importá el CSV existente:
   **Archivo → Importar → Subir** → seleccioná `productos_optimizados.csv`
   → elegí "Reemplazar hoja de cálculo" → Importar

3. **Publicar el sheet como CSV:**
   **Archivo → Compartir → Publicar en la web**
   → Hoja: elegí la hoja con los productos
   → Formato: **Valores separados por comas (.csv)**
   → Hacer clic en **Publicar**
   → Copiar la URL generada

### 2. Configurar en Netlify

**Site configuration → Environment variables → Add variable**

| Variable | Valor |
|----------|-------|
| `SHEET_CSV_URL` | La URL del paso anterior |
| `VITE_API_URL` | URL de tu backend en Render (para pedidos) |

### 3. Redesplegar en Netlify → Deploys → Trigger deploy

---

## ✏️ Editar productos (uso diario)

Abrí el Google Sheet y editá directamente:

- **Cambiar precio:** modificá la columna `precio`
- **Quitar producto temporalmente:** cambiá `stock` a `no`
- **Agregar producto:** agregá una fila nueva
- Los cambios se ven en la web en **menos de 5 minutos**

---

## 📋 Columnas del Sheet

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `id` | ID único sin espacios | `aceite-coco-125ml` |
| `nombre` | Nombre del producto | `ACEITE DE COCO 125ML` |
| `descripcion` | Descripción (opcional) | `Prensado en frío` |
| `precio` | Precio en pesos | `5500` |
| `imagen` | URL de imagen | `https://images.unsplash.com/...` |
| `stock` | Disponibilidad | `si` o `no` |
| `categoria` | Categoría | `ACEITES, VINAGRES Y SALSAS` |
| `caracteristicas` | Atributos separados por `\|` | `Sin TACC\|Vegano` |

---

## 🚀 Desarrollo local

```bash
npm install
npm run dev
```
