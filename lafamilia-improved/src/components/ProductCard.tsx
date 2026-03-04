import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { getSizeLabel } from '../utils/sizeLabel';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 1;

  const [selectedVariant, setSelectedVariant] = useState<Product>(
    hasVariants ? product.variants![0] : product
  );

  const handleCardClick = () => {
    // Pasamos el producto completo (con todas las variantes) al modal
    onViewDetails(product);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col h-full group hover:shadow-lg transition-all duration-300">

      {/* Imagen: toda el area es un boton que abre el modal */}
      <button
        onClick={handleCardClick}
        className="relative w-full aspect-square overflow-hidden rounded-t-2xl bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <img
          src={selectedVariant.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {!selectedVariant.inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-stone-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              Sin Stock
            </span>
          </div>
        )}

        {/* Overlay hover que indica que se puede ver el detalle */}
        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            Ver detalle
          </span>
        </div>
      </button>

      <div className="p-4 flex flex-col flex-grow">

        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit mb-2">
          {product.category}
        </span>

        {/* Nombre clickeable */}
        <button
          onClick={handleCardClick}
          className="text-left font-serif text-base font-bold text-stone-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors mb-2"
        >
          {product.name}
        </button>

        {product.characteristics && product.characteristics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.characteristics.slice(0, 2).map((char, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase tracking-wide font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm"
              >
                {char}
              </span>
            ))}
          </div>
        )}

        {/* Selector de variantes como chips — reemplaza el <select> nativo */}
        {hasVariants && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
              Tamaño / Presentación
            </p>
            <div className="flex flex-wrap gap-1.5">
              {product.variants!.map(v => {
                const isSelected = v.id === selectedVariant.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {getSizeLabel(v.name)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Precio + botón */}
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-stone-900">
            {formatPrice(selectedVariant.price)}
          </span>

          <button
            onClick={() => onAddToCart(selectedVariant)}
            disabled={!selectedVariant.inStock}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              selectedVariant.inStock
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
