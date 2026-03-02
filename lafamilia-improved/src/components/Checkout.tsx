import { useState } from 'react';
import { motion } from 'motion/react';
import { CartItem } from '../types';
import { ArrowLeft, CreditCard, Truck, Store, Banknote, Landmark } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface CheckoutProps {
  items: CartItem[];
  onBack: () => void;
  onConfirm: (orderNumber?: string) => void;
}

export function Checkout({ items, onBack, onConfirm }: CheckoutProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('transfer');
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = deliveryMethod === 'delivery' ? 2500 : 0;
  const discount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shippingCost - discount;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg(null);
  setIsSubmitting(true);
  
  try {
    const formData = new FormData(e.target as HTMLFormElement);
    const customerInfo = Object.fromEntries(formData.entries());

    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Ya no enviamos "total", el backend lo calcula. Pasamos los métodos elegidos.
        items: items,
        customerInfo: customerInfo,
        deliveryMethod: deliveryMethod,
        paymentMethod: paymentMethod
      })
    });

    const data = await response.json();
    
    if (data.success) {
      onConfirm(data.orderNumber);
    } else {
      setErrorMsg(data.error || 'Ocurrió un error al procesar el pedido.');
    }
  } catch (error) {
    console.error('Error al conectar con el servidor:', error);
    setErrorMsg('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-8 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Volver a la tienda
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Finalizar Compra</h1>
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-4">1. Datos Personales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nombre completo</label>
                  {/* BUG FIX: agregado name="nombre" para que FormData lo capture */}
                  <input
                    required
                    type="text"
                    name="nombre"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Juan Perez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Telefono / WhatsApp</label>
                  <input
                    required
                    type="tel"
                    name="telefono"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-4">2. Metodo de Entrega</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <label className={"cursor-pointer flex items-center gap-3 p-4 border rounded-xl transition-all " + (deliveryMethod === "delivery" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-stone-200 hover:border-emerald-200")}>
                  <input type="radio" name="metodo_entrega" value="delivery" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} className="text-emerald-600 focus:ring-emerald-500" />
                  <Truck className={"w-5 h-5 " + (deliveryMethod === "delivery" ? "text-emerald-600" : "text-stone-400")} />
                  <div>
                    <p className="font-medium text-stone-900">Envio a domicilio</p>
                    <p className="text-sm text-stone-500">{formatPrice(2500)}</p>
                  </div>
                </label>
                <label className={"cursor-pointer flex items-center gap-3 p-4 border rounded-xl transition-all " + (deliveryMethod === "pickup" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-stone-200 hover:border-emerald-200")}>
                  <input type="radio" name="metodo_entrega" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="text-emerald-600 focus:ring-emerald-500" />
                  <Store className={"w-5 h-5 " + (deliveryMethod === "pickup" ? "text-emerald-600" : "text-stone-400")} />
                  <div>
                    <p className="font-medium text-stone-900">Retiro en local</p>
                    <p className="text-sm text-emerald-600 font-medium">Gratis</p>
                  </div>
                </label>
              </div>

              {deliveryMethod === "delivery" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Direccion completa</label>
                    <input
                      required
                      type="text"
                      name="direccion"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Calle 123, Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Codigo Postal</label>
                    <input
                      required
                      type="text"
                      name="codigo_postal"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Piso / Depto <span className="text-stone-400">(Opcional)</span></label>
                    <input
                      type="text"
                      name="piso_depto"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="3B"
                    />
                  </div>
                </motion.div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-4">3. Metodo de Pago</h2>
              <div className="space-y-3">
                <label className={"cursor-pointer flex items-center gap-3 p-4 border rounded-xl transition-all " + (paymentMethod === "transfer" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-stone-200 hover:border-emerald-200")}>
                  <input type="radio" name="metodo_pago" value="transfer" checked={paymentMethod === "transfer"} onChange={() => setPaymentMethod("transfer")} className="text-emerald-600 focus:ring-emerald-500" />
                  <Landmark className={"w-5 h-5 " + (paymentMethod === "transfer" ? "text-emerald-600" : "text-stone-400")} />
                  <div>
                    <p className="font-medium text-stone-900">Transferencia Bancaria</p>
                    <p className="text-sm text-emerald-600 font-semibold">10% de descuento</p>
                  </div>
                </label>
                <label className={"cursor-pointer flex items-center gap-3 p-4 border rounded-xl transition-all " + (paymentMethod === "card" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-stone-200 hover:border-emerald-200")}>
                  <input type="radio" name="metodo_pago" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="text-emerald-600 focus:ring-emerald-500" />
                  <CreditCard className={"w-5 h-5 " + (paymentMethod === "card" ? "text-emerald-600" : "text-stone-400")} />
                  <div>
                    <p className="font-medium text-stone-900">Tarjeta de Credito / Debito</p>
                    <p className="text-sm text-stone-500">Hasta 3 cuotas sin interes</p>
                  </div>
                </label>
                <label className={"cursor-pointer flex items-center gap-3 p-4 border rounded-xl transition-all " + (paymentMethod === "cash" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-stone-200 hover:border-emerald-200")}>
                  <input type="radio" name="metodo_pago" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="text-emerald-600 focus:ring-emerald-500" />
                  <Banknote className={"w-5 h-5 " + (paymentMethod === "cash" ? "text-emerald-600" : "text-stone-400")} />
                  <div>
                    <p className="font-medium text-stone-900">Efectivo al entregar</p>
                    <p className="text-sm text-stone-500">Solo valido para retiro o envio local</p>
                  </div>
                </label>
              </div>
            </section>
          </form>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Resumen de Compra</h2>
            
            <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <li key={item.product.id} className="flex justify-between text-sm gap-2">
                  <div className="flex gap-2 min-w-0">
                    <span className="text-stone-400 flex-shrink-0">{item.quantity}x</span>
                    <span className="text-stone-800 font-medium truncate">{item.product.name}</span>
                  </div>
                  <span className="text-stone-900 whitespace-nowrap font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-stone-100 pt-4 space-y-2.5 mb-6 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Envio</span>
                <span>{shippingCost === 0 ? <span className="text-emerald-600 font-medium">Gratis</span> : formatPrice(shippingCost)}</span>
              </div>
              {paymentMethod === "transfer" && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Descuento transferencia (10%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-stone-900 font-bold text-lg">Total</span>
                <span className="text-3xl font-bold text-emerald-700">{formatPrice(total)}</span>
              </div>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                isSubmitting 
                  ? 'bg-emerald-400 text-white cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
            <p className="text-xs text-stone-400 text-center mt-3">Te contactaremos para coordinar el pago y la entrega</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
