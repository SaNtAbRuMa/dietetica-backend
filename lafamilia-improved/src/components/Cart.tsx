import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { FREE_SHIPPING_THRESHOLD } from '../config';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountLeft = FREE_SHIPPING_THRESHOLD - total;
  const qualifiesFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel lateral */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-stone-900">Tu Carrito</h2>
                {items.length > 0 && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {items.reduce((s, i) => s + i.quantity, 0)} ítems
                  </span>
                )}
              </div>
              {/* Botón X — 44×44 mínimo */}
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo scrolleable */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16 gap-4">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-stone-200" />
                  </div>
                  <div>
                    <p className="text-stone-900 font-bold text-lg">Tu carrito está vacío</p>
                    <p className="text-stone-400 text-sm mt-1">Agregá productos para empezar</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                  >
                    Ver productos
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-stone-50 px-5 py-2">
                  {items.map(item => (
                    <li key={item.product.id} className="py-4 flex gap-3">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-stone-100 shrink-0" style={{ minWidth: 64 }}>
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2">
                            {item.product.name}
                          </p>
                          {/* Botón eliminar — 44×44 */}
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="w-9 h-9 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 -mt-1 -mr-1"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-stone-400">{formatPrice(item.product.price)} c/u</p>

                        <div className="flex items-center justify-between mt-1">
                          {/* Controles cantidad — 44px de alto */}
                          <div className="flex items-center bg-stone-100 rounded-xl overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-11 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors"
                              aria-label="Reducir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-stone-900 select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-11 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-stone-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer con totales */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-stone-100 bg-stone-50 px-5 pt-4 pb-6 space-y-3">
                {/* Barra envío gratis */}
                <div>
                  {qualifiesFreeShipping ? (
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      🎉 ¡Tenés envío gratis!
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      Te faltan <strong className="text-stone-700 mx-1">{formatPrice(amountLeft)}</strong> para envío gratis
                    </p>
                  )}
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-bold text-stone-900 text-base">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-stone-400 -mt-1">El envío se calcula en el siguiente paso</p>

                {/* Botón checkout — 56px de alto para mobile */}
                <button
                  onClick={onCheckout}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  Finalizar compra
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
