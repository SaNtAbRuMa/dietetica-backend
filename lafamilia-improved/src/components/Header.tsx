import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Leaf, Search, ChevronDown, X, Filter } from 'lucide-react';

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
  onCategorySelect,
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

  const isActive = !!selectedCategory;
  const buttonLabel = selectedCategory
    ? selectedCategory.length > 14 ? selectedCategory.substring(0, 14) + '…' : selectedCategory
    : 'Categorías';

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
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
            <span className="font-serif text-xl font-bold text-stone-800 tracking-tight hidden sm:block">
              La Familia
            </span>
          </button>

          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-9 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Derecha */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dropdown categorías */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Filter className="w-4 h-4 shrink-0" />
                <span className="hidden sm:block max-w-[110px] truncate">{buttonLabel}</span>
                {/* X para quitar filtro rápido */}
                {isActive ? (
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); handleCategorySelect(null); }}
                    className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <ChevronDown className={`w-4 h-4 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden"
                  style={{ width: 'min(280px, calc(100vw - 32px))' }}
                >
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Filtrar por categoría
                    </span>
                    <button onClick={() => setDropdownOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Lista scrolleable: 45 categorías caben sin salirse de pantalla */}
                  <div className="overflow-y-auto" style={{ maxHeight: 'min(60vh, 380px)' }}>
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                        !selectedCategory ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span>Todas las categorías</span>
                      {!selectedCategory && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />}
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          selectedCategory === cat ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span className="capitalize">{cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}</span>
                        {selectedCategory === cat && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Carrito */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-stone-600 hover:text-emerald-600 transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-emerald-600 rounded-full px-1">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
