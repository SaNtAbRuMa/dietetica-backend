import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { X, ShoppingCart, CheckCircle2, Package } from 'lucide-react';
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
  const hasSingleVariant = product.variants && product.variants.length === 1;

  // SIEMPRE usar la variante real: nunca el objeto grupo (que tiene nombre sin tamaño)
  const getInitialVariant = () => product.variants ? product.variants[0] : product;

  const [selectedVariant, setSelectedVariant] = useState<Product>(getInitialVariant);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setSelectedVariant(getInitialVariant());
    setJustAdded(false);
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

  // displayProduct: siempre la variante seleccionada (tiene nombre completo con tamaño)
  const displayProduct = selectedVariant;

  const handleAddToCart = () => {
    onAddToCart(displayProduct);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden max-h-[92dvh] rounded-t-3xl sm:rounded-2xl"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-stone-300 rounded-full z-10" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-stone-500 hover:text-stone-900 shadow-sm transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Imagen */}
            <div className="sm:w-5/12 h-56 sm:h-auto relative shrink-0">
              <motion.img
                key={displayProduct.imageUrl}
                initial={{ opacity: 0.7, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
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

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto flex flex-col p-5 sm:p-7">
              <div className="mt-4 sm:mt-0">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  {product.category}
                </p>
                {/* Nombre base del producto (sin tamaño) */}
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug mb-1">
                  {product.name}
                </h2>
                {/* Si es producto con variante única, mostrar el tamaño */}
                {hasSingleVariant && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200 mb-3">
                    {getSizeLabel(product.variants![0].name)}
                  </span>
                )}

                {/* Precio con animación al cambiar variante */}
                <motion.p
                  key={displayProduct.price}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-bold text-emerald-700 mb-4"
                >
                  {formatPrice(displayProduct.price)}
                </motion.p>
              </div>

              {/* Selector de tamaños — solo si hay más de 1 variante */}
              {hasVariants && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Package className="w-3.5 h-3.5 text-stone-400" />
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Elegí el tamaño
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map(v => {
                      const isSelected = v.id === selectedVariant.id;
                      return (
                        <motion.button
                          key={v.id}
                          onClick={() => v.inStock && setSelectedVariant(v)}
                          whileTap={{ scale: 0.96 }}
                          className={`relative px-3.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                              : v.inStock
                              ? 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                              : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through'
                          }`}
                        >
                          <span className="leading-none font-bold">{getSizeLabel(v.name)}</span>
                          <span className={`text-[11px] leading-none mt-1 font-semibold ${
                            isSelected ? 'text-emerald-400' : 'text-stone-400'
                          }`}>
                            {formatPrice(v.price)}
                          </span>
                          {!v.inStock && (
                            <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-stone-400 text-white px-1.5 py-0.5 rounded-full font-bold">
                              agotado
                            </span>
                          )}
                        </motion.button>
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

              {/* Botón agregar con feedback */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!displayProduct.inStock || justAdded}
                whileTap={{ scale: 0.98 }}
                className={`mt-auto w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all duration-200 ${
                  justAdded
                    ? 'bg-emerald-500 text-white'
                    : displayProduct.inStock
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                }`}
              >
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      ¡Agregado al carrito!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {displayProduct.inStock
                        ? `Agregar · ${formatPrice(displayProduct.price)}`
                        : 'Sin stock'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
