-- =============================================
-- La Familia Dietética — Schema de base de datos
-- Ejecutar en la consola SQL de Neon para inicializar.
-- =============================================

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  order_number     VARCHAR(20)    NOT NULL UNIQUE,
  total            NUMERIC(10,2)  NOT NULL,
  status           VARCHAR(30)    NOT NULL DEFAULT 'pendiente',
  -- Estados posibles:
  --   pendiente        → esperando confirmación manual (efectivo / transferencia)
  --   pendiente_pago   → aguardando pago en MercadoPago
  --   pagado           → pago MP aprobado
  --   pago_rechazado   → pago MP rechazado
  --   pago_pendiente   → pago MP en revisión
  --   confirmado       → el local confirmó el pedido
  --   en_camino        → en camino al cliente
  --   entregado        → entregado con éxito
  --   cancelado        → cancelado por cualquier motivo
  items            JSONB          NOT NULL,
  customer_info    JSONB          NOT NULL,
  delivery_method  VARCHAR(20),   -- 'delivery' | 'pickup'
  payment_method   VARCHAR(20),   -- 'transfer' | 'mercadopago' | 'cash'
  mp_preference_id VARCHAR(100),  -- ID de preferencia MP (si aplica)
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status);

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Migración si la tabla ya existe (agregá las columnas faltantes)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method  VARCHAR(20);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(20);
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(100);
