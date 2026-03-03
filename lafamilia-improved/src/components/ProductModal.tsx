import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { getSizeLabel } from '../utils/sizeLabel';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const hasVariants = product.variants && product.variants.length > 1;

  const [selectedVariant, setSelectedVariant] = useState<Product>(
    hasVariants ? product.variants![0] : product
  );

  useEffect(() => {
    setSelectedVariant(hasVariants ? product.variants![0] : product);
  }, [product.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const displayProduct = hasVariants ? selectedVariant : product;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/*
            Mobile: desliza desde abajo (bottom sheet)
            Desktop: aparece centrado con zoom suave
          */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden max-h-[92dvh] rounded-t-3xl sm:rounded-2xl"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Handle visual solo mobile */}
            <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-stone-300 rounded-full z-10" />

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-stone-500 hover:text-stone-900 shadow-sm transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Imagen */}
            <div className="sm:w-5/12 h-56 sm:h-auto relative shrink-0">
              <img
                src={displayProduct.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {!displayProduct.inStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-full">
                    Sin Stock
                  </span>
                </div>
              )}
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto flex flex-col p-5 sm:p-7">
              <div className="mt-4 sm:mt-0">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  {product.category}
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug mb-1">
                  {product.name}
                </h2>
                <p className="text-2xl font-bold text-emerald-700 mb-4">
                  {formatPrice(displayProduct.price)}
                </p>
              </div>

              {/* Chips de variantes — igual que ProductCard */}
              {hasVariants && (
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Tamaño / Presentación
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map(v => {
                      const isSelected = v.id === selectedVariant.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all min-h-[40px] ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {getSizeLabel(v.name)}
                          <span className={`ml-1.5 text-xs font-normal ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                            {formatPrice(v.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {displayProduct.description && (
                <p className="text-stone-500 text-sm leading-relaxed mb-4">
                  {displayProduct.description}
                </p>
              )}

              {/* Características */}
              {displayProduct.characteristics && displayProduct.characteristics.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Características
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {displayProduct.characteristics.map((char, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-100 px-2.5 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón agregar — 56px de alto para mobile */}
              <button
                onClick={() => { onAddToCart(displayProduct); onClose(); }}
                disabled={!displayProduct.inStock}
                className={`mt-auto w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all ${
                  displayProduct.inStock
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-[0.98]'
                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {displayProduct.inStock ? 'Agregar al carrito' : 'Sin stock'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
