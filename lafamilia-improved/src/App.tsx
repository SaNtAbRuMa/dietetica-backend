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
import { API_BASE } from './config';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'success' | 'admin'>('store');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Product[]) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando productos:', err);
        setLoadError(true);
        setIsLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
    window.scrollTo(0, 0);
  };

  const handleConfirmOrder = (orderNumber?: string) => {
    if (orderNumber) setLastOrderNumber(orderNumber);
    setCartItems([]);
    setCurrentView('success');
    window.scrollTo(0, 0);
  };

  const handleBackToStore = () => {
    setCurrentView('store');
    window.scrollTo(0, 0);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {currentView !== 'admin' && (
        <Header
          cartItemCount={cartItemCount}
          onOpenCart={() => setIsCartOpen(true)}
          onLogoClick={handleBackToStore}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      )}

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero />
              <section id="productos" className="py-20 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl mb-3">
                      Nuestros Productos
                    </h2>
                    {selectedCategory && (
                      <p className="text-stone-500 mt-2">
                        Mostrando:{' '}
                        <span className="font-semibold text-emerald-700">{selectedCategory}</span>
                        {' — '}
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="text-emerald-600 hover:underline"
                        >
                          Ver todos
                        </button>
                      </p>
                    )}
                  </div>

                  {isLoading && (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-stone-500 font-medium">Cargando catálogo actualizado...</p>
                    </div>
                  )}

                  {!isLoading && loadError && (
                    <div className="text-center py-20">
                      <p className="text-red-500 font-medium mb-2">No se pudo cargar el catálogo.</p>
                      <p className="text-stone-400 text-sm">
                        Verificá tu conexión o intentá recargar la página.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {!isLoading && !loadError && filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-stone-500 font-medium">
                        No se encontraron productos para "{searchQuery}".
                      </p>
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                        className="mt-4 text-emerald-600 hover:underline text-sm"
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  )}

                  {!isLoading && !loadError && filteredProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map((product) => (
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
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Checkout
                items={cartItems}
                onBack={handleBackToStore}
                onConfirm={handleConfirmOrder}
              />
            </motion.div>
          )}

          {currentView === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OrderSuccess onBackToStore={handleBackToStore} orderNumber={lastOrderNumber} />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel onBack={handleBackToStore} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {currentView !== 'admin' && (
        <footer className="bg-stone-900 text-stone-400 py-10 text-center">
          <p
            className="text-xs cursor-pointer hover:text-stone-300 transition-colors select-none"
            onDoubleClick={() => setCurrentView('admin')}
          >
            © {new Date().getFullYear()} La Familia Dietética · Doble clic aquí para administrar
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
    </div>
  );
}
