import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Leaf, Search, ChevronDown, X } from 'lucide-react';

interface HeaderProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onLogoClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function Header({
  cartItemCount,
  onOpenCart,
  onLogoClick,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCategorySelect = (category: string | null) => {
    onCategorySelect(category);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">

          {/* Logo: usa imagen si existe, sino el icono SVG de Leaf */}
          <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Logo La Familia"
                className="h-8 w-8 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            <span className="font-serif text-xl font-bold text-stone-800 tracking-tight hidden sm:block">La Familia</span>
          </button>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-9 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700 transition-colors rounded-full"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-emerald-600 transition-colors py-2"
              >
                <span className="hidden sm:block">Categorias</span>
                <span className="sm:hidden">Cat.</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-stone-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="py-1">
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors ${!selectedCategory ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-stone-600'}`}
                    >
                      Todas
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors ${selectedCategory === cat ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-stone-600'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onOpenCart}
              className="relative p-2 text-stone-600 hover:text-emerald-600 transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-emerald-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
