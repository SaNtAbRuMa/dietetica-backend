# La Familia Dietética 🌿

Tienda online para dietética natural. Frontend en Netlify, backend en Render, base de datos en Neon (PostgreSQL).

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion → Netlify
- **Backend:** Express.js + TypeScript (tsx) → Render
- **Base de datos:** PostgreSQL via Neon (serverless)
- **Catálogo:** CSV local o URL pública de Google Sheets

---

## Setup inicial (primera vez)

### 1. Base de datos (Neon)

1. Crear una cuenta en [neon.tech](https://neon.tech) y crear un proyecto.
2. En la consola SQL de Neon, ejecutar el contenido de **`schema.sql`**.
3. Copiar el *connection string* (empieza con `postgres://...`).

### 2. Backend (Render)

1. Crear un nuevo **Web Service** en [render.com](https://render.com) conectado a tu repo de GitHub.
2. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
3. En **Environment**, agregar las siguientes variables (ver `.env.example`):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Neon |
| `ADMIN_PASSWORD` | Contraseña del panel admin (mínimo 16 chars) |
| `ADMIN_TOKEN` | Token secreto del panel admin |
| `ALLOWED_ORIGIN` | URL exacta del sitio en Netlify (ej: `https://lafamilia.netlify.app`) |
| `OWNER_WHATSAPP` | Número del dueño para notificaciones (ej: `5492284638849`) |
| `SHEET_URL` | URL CSV de Google Sheets (opcional, si no usa el archivo local) |

### 3. Frontend (Netlify)

1. Conectar el repo en [netlify.com](https://netlify.com).
2. Configurar en **Site settings → Environment variables**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL del backend en Render (ej: `https://mi-backend.onrender.com`) |

3. El `netlify.toml` ya tiene configurado el build command y los redirects para SPA.

---

## Desarrollo local

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Crear archivo .env basado en el ejemplo
cp .env.example .env
# Editar .env con tus valores locales

# 3. Levantar el backend (puerto 3001)
npm run server

# 4. En otra terminal, levantar el frontend (puerto 3000)
npm run dev
```

El proxy de Vite redirige `/api/*` → `localhost:3001` automáticamente en desarrollo.

---

## Configurar MercadoPago (opcional)

1. Crear una cuenta en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers/panel).
2. Ir a **Tus aplicaciones → Credenciales de producción** y copiar el **Access Token** (empieza con `APP_USR-`).
3. En Render → Environment, agregar:
   ```
   MP_ACCESS_TOKEN  → APP_USR-tu-access-token
   FRONTEND_URL     → https://tu-sitio.netlify.app
   ```
4. Redesplegá el servicio. El botón de MercadoPago aparecerá automáticamente en el checkout.

> Para probar antes de salir a producción, usá un **Access Token de TEST** (empieza con `TEST-`). Las credenciales de test se encuentran en la misma sección del panel de MP.

**Flujo de pago:**
1. Cliente elige MercadoPago en el checkout → se crea el pedido con estado `pendiente_pago`.
2. El cliente es redirigido a MercadoPago para pagar.
3. MP llama al webhook `/api/mp/webhook` → el pedido pasa a `pagado`.
4. MP redirige al cliente de vuelta al sitio → ve la pantalla de confirmación.
5. El dueño recibe notificación por WhatsApp con el detalle del pedido.

---

## Panel de Administración

Acceder desde el footer → "Admin". Requiere la contraseña configurada en `ADMIN_PASSWORD`.

Incluye:
- **Dashboard de stats**: pedidos de hoy, activos, históricos, ingresos totales.
- **Filtro por estado**: tabs para cada estado del pedido.
- **Búsqueda**: por número de orden o nombre del cliente.
- **Cards de pedido**: con detalle de ítems, método de pago/entrega, dirección.
- **Cambio de estado**: dropdown con transiciones válidas por estado.

**Flujo de estados:**
```
pendiente / pendiente_pago / pagado
        ↓
    confirmado → en_camino → entregado
        ↓
    cancelado (desde cualquier estado activo)
```

---

## Actualizar el catálogo de productos

**Opción A — Google Sheets (recomendado):**
1. Editar la hoja de cálculo con los productos.
2. Ir a Archivo → Compartir → Publicar en la web → Formato CSV.
3. Copiar la URL y ponerla en `SHEET_URL` (en Render y en `.env`).
4. El backend refresca el catálogo cada 5 minutos automáticamente.

**Opción B — CSV local:**
1. Editar `productos_optimizados.csv`.
2. Hacer commit y push → Render redespliega automáticamente.

**Formato del CSV:**
```
id, nombre, descripcion, precio, imagen_url, en_stock, categoria, caracteristicas
```

---

## Panel de administración

Acceder desde el footer del sitio → "Admin".

Permite:
- Ver todos los pedidos ordenados por fecha
- Cambiar el estado de cada pedido (pendiente → confirmado → en camino → entregado)

---

## Notas de producción

- El backend en Render free tier "duerme" tras 15 min de inactividad. El frontend muestra automáticamente un banner de aviso durante el cold start.
- Los números de orden usan el `id` autoincremental de PostgreSQL para evitar duplicados (`#LF-00001`, `#LF-00002`, etc.).
