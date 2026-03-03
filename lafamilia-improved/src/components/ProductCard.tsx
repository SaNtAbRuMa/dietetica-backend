import { useState, memo } from 'react';
import { Plus, Info } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { getSizeLabel } from '../utils/sizeLabel';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

function ProductCardInner({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  // Si tiene variantes agrupadas, empezamos mostrando la más barata
  const [selectedVariant, setSelectedVariant] = useState<Product>(
    product.variants && product.variants.length > 0 ? product.variants[0] : product
  );

  const hasVariants = product.variants && product.variants.length > 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full group">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <img 
          src={selectedVariant.imageUrl} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!selectedVariant.inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-stone-900 text-white px-4 py-1.5 rounded-full text-sm font-medium">Sin Stock</span>
          </div>
        )}
        <button 
          onClick={() => onViewDetails(selectedVariant)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-stone-600 hover:text-emerald-600 hover:bg-white transition-colors shadow-sm"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-1">
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{product.category}</span>
        </div>
        
        {/* Usamos el nombre base agrupado (ej: Aceite De Coco Gb Neutro) */}
        <h3 className="font-serif text-lg font-bold text-stone-900 mb-1 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {product.characteristics?.slice(0, 2).map((char, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-sm">
              {char}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-stone-100">
          
          {/* LA LISTA DESPLEGABLE DE TAMAÑOS */}
          {hasVariants ? (
            <select 
              className="w-full text-sm font-medium border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 bg-stone-50 text-stone-700 cursor-pointer"
              value={selectedVariant.id}
              onChange={(e) => {
                const variant = product.variants!.find(v => v.id === e.target.value);
                if (variant) setSelectedVariant(variant);
              }}
            >
              {product.variants!.map(v => (
                <option key={v.id} value={v.id}>
                  {getSizeLabel(v.name)} - ${v.price.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-[38px]"></div> // Espaciador invisible para que las tarjetas no queden chuecas
          )}

          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              {hasVariants && <span className="text-[10px] text-stone-400 font-medium">Seleccionado:</span>}
              <span className="text-xl font-bold text-stone-900">
                ${selectedVariant.price.toLocaleString('es-AR')}
              </span>
            </div>
            
            <button 
              onClick={() => onAddToCart(selectedVariant)}
              disabled={!selectedVariant.inStock}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                selectedVariant.inStock 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// memo evita re-renders cuando el producto no cambió (importante con catálogos grandes)
export const ProductCard = memo(ProductCardInner);