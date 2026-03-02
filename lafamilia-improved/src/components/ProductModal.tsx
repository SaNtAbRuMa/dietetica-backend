import { Product } from '../types';
import { X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col sm:flex-row animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-stone-500 hover:text-stone-800 z-10 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="sm:w-1/2 h-64 sm:h-auto relative">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <span className="px-4 py-2 bg-stone-800 text-white text-sm font-bold uppercase tracking-wider rounded-full">
                Sin Stock
              </span>
            </div>
          )}
        </div>

        <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col">
          <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-2">{product.category}</p>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">{product.name}</h2>
          <p className="text-2xl font-bold text-emerald-700 mb-6">{formatPrice(product.price)}</p>
          
          <p className="text-stone-600 mb-6 leading-relaxed text-sm">
            {product.description}
          </p>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">Características</h3>
            <ul className="space-y-2">
              {product.characteristics.map((char, index) => (
                <li key={index} className="flex items-center gap-2 text-stone-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm">{char}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            disabled={!product.inStock}
            className={`mt-auto w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              product.inStock 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.inStock ? 'Agregar al carrito' : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
}
