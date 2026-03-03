import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AdminPanel } from './components/AdminPanel';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderSuccess } from './components/OrderSuccess';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Product, CartItem } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // --- NUEVO: ESTADOS DE ORDENAMIENTO Y NOTIFICACIONES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'>('name_asc');
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  // --- NUEVO: SISTEMA DE NAVEGACIÓN (Botón Atrás arreglado) ---
  const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'success' | 'admin'>('store');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

  useEffect(() => {
    // Escucha cuando el usuario toca la flecha de "Atrás" o "Adelante" en el navegador
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'store';
      if (['store', 'checkout', 'success', 'admin'].includes(hash)) {
        setCurrentView(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Revisión inicial al cargar
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string) => {
    window.location.hash = view; // Esto cambia la URL y activa la vista automáticamente
    window.scrollTo(0, 0);
  };

  // --- CARGA DE PRODUCTOS ---
  useEffect(() => {
    fetch('https://dietetica-backend.onrender.com/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error cargando productos:", err);
        setIsLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();

  // --- NUEVO: LÓGICA DE ORDENAMIENTO ---
  const filteredAndSortedProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
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
    });

  // --- NUEVO: AGREGAR AL CARRITO CON NOTIFICACIÓN TOAST ---
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
    
    // Muestra el cartel verde abajo y no abre el carrito
    setToast({ message: `${product.name} agregado al carrito`, id: Date.now() });
    setTimeout(() => setToast(null), 3000); // Se borra solo a los 3 segundos
  };

  const handleUpdateQuantity = (productId: string, delta: number) => setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  const handleRemoveItem = (productId: string) => setCartItems(prev => prev.filter(item => item.product.id !== productId));
  
  const handleCheckout = () => { setIsCartOpen(false); navigateTo('checkout'); };
  const handleConfirmOrder = (orderNumber?: string) => { if (orderNumber) setLastOrderNumber(orderNumber); setCartItems([]); navigateTo('success'); };
  const handleBackToStore = () => { navigateTo('store'); };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col relative">
      {currentView !== 'admin' && (
        <Header cartItemCount={cartItemCount} onOpenCart={() => setIsCartOpen(true)} onLogoClick={handleBackToStore} searchQuery={searchQuery} onSearchChange={setSearchQuery} categories={categories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      )}
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'store' && (
            <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero />
              <section id="productos" className="py-20 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  <div className="mb-10">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl mb-8 text-center">Nuestros Productos</h2>
                    
                    {!isLoading && (
                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
                        {/* Categorías */}
                        <div className="flex overflow-x-auto gap-2 w-full lg:w-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                          <button
                            onClick={() => setSelectedCategory(null)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                              !selectedCategory ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            Todas
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                selectedCategory === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* --- NUEVO: FILTRO DE ORDENAMIENTO --- */}
                        <div className="w-full lg:w-auto flex-shrink-0">
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
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
                  </div>

                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-stone-500 font-medium">Cargando catálogo actualizado...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredAndSortedProducts.map(product => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} onViewDetails={setSelectedProduct} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'checkout' && <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Checkout items={cartItems} onBack={handleBackToStore} onConfirm={handleConfirmOrder} /></motion.div>}
          {currentView === 'success' && <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><OrderSuccess onBackToStore={handleBackToStore} orderNumber={lastOrderNumber} /></motion.div>}
          {currentView === 'admin' && <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AdminPanel onBack={handleBackToStore} /></motion.div>}
        </AnimatePresence>
      </main>

      {/* --- NUEVO: NOTIFICACIÓN TOAST (Cartelito flotante) --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-stone-700"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">✓</div>
            <p className="font-medium text-sm whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView !== 'admin' && (
        <footer className="bg-stone-900 text-stone-400 py-10 text-center">
           <p className="text-xs cursor-pointer hover:text-stone-300 transition-colors" onDoubleClick={() => navigateTo('admin')}>
              © {new Date().getFullYear()} La Familia Dietética. Doble clic aquí para Administrar.
           </p>
        </footer>
      )}

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} onCheckout={handleCheckout} />
      {selectedProduct && <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
      {currentView !== 'admin' && currentView !== 'checkout' && <WhatsAppButton />}
    </div>
  );
}