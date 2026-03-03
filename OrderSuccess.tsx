import { motion } from 'motion/react';
import { CheckCircle2, ShoppingBag, MessageCircle, AlertCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../config';

interface OrderSuccessProps {
  onBackToStore: () => void;
  orderNumber?: string;
}

export function OrderSuccess({ onBackToStore, orderNumber }: OrderSuccessProps) {
  if (!orderNumber) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Error en la orden</h1>
          <p className="text-stone-500 mb-6">
            No se pudo confirmar tu pedido. Tu carrito fue conservado para que puedas intentarlo de nuevo.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Tuve un problema al finalizar mi pedido, ¿me pueden ayudar?')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#1ebe5a] transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <MessageCircle className="w-5 h-5" />
            Contactar por WhatsApp
          </a>
          <button
            onClick={onBackToStore}
            className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hola! Acabo de realizar el pedido ${orderNumber}. ¿Me pueden confirmar?`
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-[70vh] flex items-center justify-center px-4 py-12"
    >
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-100">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">¡Pedido Confirmado!</h1>
        <p className="text-stone-500 mb-6 leading-relaxed text-sm">
          Gracias por elegirnos. Nos comunicaremos a la brevedad para coordinar el pago y la
          entrega de tu pedido.
        </p>

        <div className="bg-stone-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide font-medium">
            Número de orden
          </p>
          <p className="font-mono font-bold text-stone-900 text-xl">{orderNumber}</p>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#1ebe5a] transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <MessageCircle className="w-5 h-5" />
          Consultar por WhatsApp
        </a>

        <button
          onClick={onBackToStore}
          className="w-full py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Seguir comprando
        </button>
      </div>
    </motion.div>
  );
}
