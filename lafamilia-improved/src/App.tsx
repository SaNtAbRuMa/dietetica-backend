import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AdminPanel } from './components/AdminPanel';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductSkeleton } from './components/ProductSkeleton';
import { ProductModal } from './components/ProductModal';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderSuccess } from './components/OrderSuccess';
import { WhatsAppButton } from './components/WhatsAppButton';
import { RenderWakeupBanner } from './components/RenderWakeupBanner';
import { Product, CartItem } from './types';
import { API_BASE } from './config';

// Persistencia del carrito en localStorage
const CART_STORAGE_KEY = 'lf-cart';
const loadCartFromStorage = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};
const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silencioso si localStorage no está disponible
  }
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Cargar carrito desde localStorage al iniciar
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'>('name_asc');
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'success' | 'admin'>('store');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

  // Persistir carrito en localStorage cada vez que cambia
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'store';
      if (['store', 'checkout', 'success', 'admin'].includes(hash)) {
        // Bug fix: no entrar a checkout con carrito vacío
        if (hash === 'checkout' && cartItems.length === 0) {
          navigateTo('store');
          return;
        }
        setCurrentView(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [cartItems]);

  const navigateTo = (view: string) => {
    window.location.hash = view;
    window.scrollTo(0, 0);
  };

  // Carga de productos con estado de error y botón de reintento
  const fetchProducts = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    fetch(`${API_BASE}/api/products`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        setIsLoading(false);
        setLoadError(true);
      });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort(),
    [products]
  );

  const filteredAndSortedProducts = useMemo(() =>
    products
      .filter(p => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        return 0;
      }),
    [products, searchQuery, selectedCategory, sortBy]
  );

  const isFiltering = !!searchQuery || !!selectedCategory;

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing)
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      return [...prev, { product, quantity: 1 }];
    });
    setToast({ message: `${product.name} agregado`, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateQuantity = (productId: string, delta: number) =>
    setCartItems(prev =>
      prev
        .map(item =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter(item => item.quantity > 0)
    );

  const handleRemoveItem = (productId: string) =>
    setCartItems(prev => prev.filter(item => item.product.id !== productId));

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  const handleConfirmOrder = (orderNumber?: string) => {
    if (orderNumber) {
      // Bug fix: solo vaciar el carrito cuando hay número de orden confirmado
      setLastOrderNumber(orderNumber);
      setCartItems([]);
    }
    navigateTo('success');
  };

  const handleBackToStore = () => navigateTo('store');

  // Seleccionar categoría desde el header y hacer scroll a la sección de productos
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    if (currentView === 'store') {
      setTimeout(() => {
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col relative">
      {currentView !== 'admin' && (
        <Header
          cartItemCount={cartItemCount}
          onOpenCart={() => setIsCartOpen(true)}
          onLogoClick={handleBackToStore}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      )}

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'store' && (
            <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero />
              <section id="productos" className="py-20 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                  <div className="mb-10">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl mb-8 text-center">
                      Nuestros Productos
                    </h2>

                    {!isLoading && !loadError && (
                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
                        {/* Chips de categorías */}
                        <div
                          className="flex overflow-x-auto gap-2 w-full lg:w-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          <button
                            onClick={() => handleCategorySelect(null)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                              !selectedCategory
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            Todas
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => handleCategorySelect(cat)}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                selectedCategory === cat
                                  ? 'bg-stone-900 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Ordenamiento */}
                        <div className="w-full lg:w-auto flex-shrink-0">
                          <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="w-full lg:w-auto px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="name_asc">Orden: A - Z</option>
                            <option value="name_desc">Orden: Z - A</option>
                            <option value="price_asc">Precio: Menor a Mayor</option>
                            <option value="price_desc">Precio: Mayor a Menor</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Contador de resultados cuando hay filtros activos */}
                    {!isLoading && !loadError && isFiltering && (
                      <p className="text-sm text-stone-500 mt-3 text-center">
                        {filteredAndSortedProducts.length === 0
                          ? 'Sin resultados'
                          : `Mostrando ${filteredAndSortedProducts.length} de ${products.length} productos`}
                      </p>
                    )}
                  </div>

                  {/* Skeleton loader mientras carga */}
                  {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                      ))}
                    </div>
                  )}

                  {/* Estado de error con botón de reintento */}
                  {!isLoading && loadError && (
                    <div className="text-center py-20">
                      <p className="text-4xl mb-4">😕</p>
                      <p className="text-stone-700 font-semibold text-lg mb-1">
                        No pudimos cargar el catálogo
                      </p>
                      <p className="text-stone-400 text-sm mb-6">
                        Revisá tu conexión e intentá de nuevo
                      </p>
                      <button
                        onClick={fetchProducts}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {/* Sin resultados al filtrar */}
                  {!isLoading && !loadError && filteredAndSortedProducts.length === 0 && isFiltering && (
                    <div className="text-center py-20">
                      <p className="text-4xl mb-4">🔍</p>
                      <p className="text-stone-700 font-semibold text-lg mb-1">
                        No encontramos productos
                      </p>
                      <p className="text-stone-400 text-sm mb-6">
                        Probá con otra búsqueda o categoría
                      </p>
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                        className="px-6 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}

                  {/* Grid de productos */}
                  {!isLoading && !loadError && filteredAndSortedProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredAndSortedProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onViewDetails={setSelectedProduct}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'checkout' && (
            <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Checkout items={cartItems} onBack={handleBackToStore} onConfirm={handleConfirmOrder} />
            </motion.div>
          )}
          {currentView === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OrderSuccess onBackToStore={handleBackToStore} orderNumber={lastOrderNumber} />
            </motion.div>
          )}
          {currentView === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel onBack={handleBackToStore} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast de confirmación (pointer-events-none para no bloquear clicks) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-stone-700 pointer-events-none"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              ✓
            </div>
            <p className="font-medium text-sm whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView !== 'admin' && (
        <footer className="bg-stone-900 text-stone-400 py-10 text-center">
          <p
            className="text-xs cursor-pointer hover:text-stone-300 transition-colors"
            onDoubleClick={() => navigateTo('admin')}
          >
            © {new Date().getFullYear()} La Familia Dietética. Doble clic aquí para Administrar.
          </p>
        </footer>
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
      {currentView !== 'admin' && currentView !== 'checkout' && <WhatsAppButton />}
      <RenderWakeupBanner isLoading={isLoading} />
    </div>
  );
}
