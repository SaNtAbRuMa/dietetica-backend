import { Product } from '../types';
import { ShoppingCart, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col"
    >
      <div className="bg-stone-200 overflow-hidden relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-52 object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="px-3 py-1 bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-full">
              Sin Stock
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
          {product.category}
        </span>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-3">
          <h3 className="text-base font-bold text-stone-900 leading-tight mb-1">{product.name}</h3>
          <p className="text-sm text-stone-500 line-clamp-2">{product.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.characteristics.slice(0, 2).map((char, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
              {char}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <p className="text-xl font-bold text-stone-900">{formatPrice(product.price)}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(product)}
              className="p-2 border border-stone-200 text-stone-500 rounded-xl hover:bg-stone-50 hover:text-stone-700 transition-colors"
              aria-label="Ver detalles"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAddToCart(product)}
              disabled={!product.inStock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                product.inStock 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
