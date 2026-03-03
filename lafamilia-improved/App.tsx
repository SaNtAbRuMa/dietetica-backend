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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'success' | 'admin'>('store');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

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

  // Extraer las categorías únicas y quitar las vacías
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  const handleRemoveItem = (productId: string) => setCartItems(prev => prev.filter(item => item.product.id !== productId));
  const handleCheckout = () => { setIsCartOpen(false); setCurrentView('checkout'); window.scrollTo(0, 0); };
  const handleConfirmOrder = (orderNumber?: string) => { if (orderNumber) setLastOrderNumber(orderNumber); setCartItems([]); setCurrentView('success'); window.scrollTo(0, 0); };
  const handleBackToStore = () => { setCurrentView('store'); window.scrollTo(0, 0); };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
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
                  
                  {/* --- NUEVA BARRA DE CATEGORÍAS --- */}
                  <div className="mb-10">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl mb-6 text-center">Nuestros Productos</h2>
                    
                    {!isLoading && (
                      <div className="flex overflow-x-auto pb-4 gap-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                            !selectedCategory ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300'
                          }`}
                        >
                          Todas las categorías
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                              selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* ---------------------------------- */}

                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-stone-500 font-medium">Cargando catálogo actualizado...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map(product => (
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

      {currentView !== 'admin' && (
        <footer className="bg-stone-900 text-stone-400 py-10 text-center">
           <p className="text-xs cursor-pointer hover:text-stone-300 transition-colors" onDoubleClick={() => setCurrentView('admin')}>
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