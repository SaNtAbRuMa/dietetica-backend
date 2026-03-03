import { useEffect } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck } from 'lucide-react';
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

  // Bug fix: cerrar carrito con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-stone-900">Tu Carrito</h2>
              {items.length > 0 && (
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {items.reduce((s, i) => s + i.quantity, 0)} ítems
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-100"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-stone-300" />
                </div>
                <div>
                  <p className="text-stone-900 font-medium">Tu carrito está vacío</p>
                  <p className="text-stone-500 text-sm mt-1">¡Agrega algunos productos saludables!</p>
                </div>
                <button 
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <ul className="space-y-5">
                {items.map((item) => (
                  <li key={item.product.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-2 pr-2">{item.product.name}</h3>
                        <button 
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{formatPrice(item.product.price)} c/u</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-stone-200 rounded-lg">
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                            aria-label="Reducir cantidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-stone-900">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-stone-900">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-stone-100 p-6 bg-stone-50 space-y-4">
              {/* Barra de progreso de envío gratis */}
              <div>
                {qualifiesFreeShipping ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-2">
                    <Truck className="w-4 h-4" />
                    <span>🎉 ¡Tenés envío gratis!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-2">
                    <Truck className="w-4 h-4" />
                    <span>Agregá <strong className="text-stone-700">{formatPrice(amountLeft)}</strong> más para envío gratis</span>
                  </div>
                )}
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} ítems)</span>
                <span className="text-base font-semibold text-stone-700">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-stone-400 -mt-2">Envío se calcula en el siguiente paso</p>
              <button 
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                onClick={onCheckout}
              >
                Finalizar Compra →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
