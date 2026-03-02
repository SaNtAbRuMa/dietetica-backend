/**
 * La Familia Dietetica - Tienda Online
 */
import { AdminPanel } from './components/AdminPanel';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderSuccess } from './components/OrderSuccess';
import { WhatsAppButton } from './components/WhatsAppButton';
import { products } from './data/products';
import { Product, CartItem } from './types';
import { Leaf, Truck, Shield, Clock, MapPin, Phone, Instagram, Facebook, Heart } from 'lucide-react';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [currentView, setCurrentView] = useState<'store' | 'checkout' | 'success' | 'admin'>('store');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => 
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
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
  };

  const handleConfirmOrder = (orderNumber?: string) => {
    if (orderNumber) setLastOrderNumber(orderNumber);
    setCartItems([]);
    setCurrentView('success');
  };

  const handleBackToStore = () => {
    setCurrentView('store');
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const features = [
    {
      icon: <Leaf className="w-6 h-6 text-emerald-600" />,
      title: 'Productos Seleccionados',
      description: 'Elegimos cada producto por su calidad, frescura y valor nutricional.',
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-600" />,
      title: 'Calidad Garantizada',
      description: 'Trabajamos con proveedores de confianza y controlamos cada lote.',
    },
    {
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      title: 'Envios a Domicilio',
      description: 'Recibí tu pedido en casa o retirá sin cargo en nuestro local.',
    },
    {
      icon: <Heart className="w-6 h-6 text-emerald-600" />,
      title: 'Atencion Personalizada',
      description: 'Te asesoramos para encontrar los productos ideales para vos.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
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
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Hero />

              <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-start gap-3"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
              
              <section id="productos" className="py-20 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl mb-3">
                      Nuestros Productos
                    </h2>
                    <p className="text-stone-500 max-w-2xl mx-auto">
                      Seleccionamos cuidadosamente cada producto para garantizar la mejor calidad y frescura para tu familia.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onViewDetails={setSelectedProduct}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-16">
                        <p className="text-stone-500 text-lg mb-3">No se encontraron productos con esa busqueda.</p>
                        <button 
                          onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                          className="text-emerald-600 font-medium hover:text-emerald-700 underline underline-offset-4"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
{/* SECCIÓN LOCALES FÍSICOS */}
              <section className="py-20 bg-white border-t border-stone-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">
                      Nuestros Locales
                    </h2>
                    <p className="text-stone-500">Visitá nuestras sucursales en Olavarría y conocé todos nuestros productos en persona.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Local 1 */}
                    <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mb-2">Sucursal Urquiza</h3>
                      <p className="text-stone-600 mb-4">Urquiza 1315 (casi Rendón), Olavarría</p>
                      <div className="flex flex-col gap-2 w-full max-w-xs">
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span>8:00 a 14:00 hs</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span>16:00 a 21:00 hs</span>
                        </div>
                      </div>
                    </div>

                    {/* Local 2 */}
                    <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mb-2">Sucursal Rivadavia</h3>
                      <p className="text-stone-600 mb-4">Rivadavia 2581 (casi Cnel. Suárez), Olavarría</p>
                      <div className="flex flex-col gap-2 w-full max-w-xs">
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span>8:00 a 14:00 hs</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span>16:00 a 21:00 hs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'checkout' && (
            <Checkout 
              key="checkout"
              items={cartItems}
              onBack={handleBackToStore}
              onConfirm={handleConfirmOrder}
            />
          )}

          {currentView === 'success' && (
            <OrderSuccess 
              key="success"
              orderNumber={lastOrderNumber}
              onBackToStore={handleBackToStore}
            />
          )}

          {currentView === 'admin' && (
            <AdminPanel 
              key="admin"
              onBack={handleBackToStore}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-stone-900 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <Leaf className="h-6 w-6 text-emerald-500" />
                <span className="font-serif text-xl font-bold tracking-tight">La Familia</span>
              </div>
              <p className="text-sm leading-relaxed">
                Dietetica natural con productos seleccionados para acompañar tu vida saludable. Calidad y frescura en cada bocado.
              </p>
              <div className="flex gap-3 mt-4">
                <a href="#" aria-label="Instagram" className="w-9 h-9 bg-stone-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Facebook" className="w-9 h-9 bg-stone-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contacto</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Urquiza 1315 / Rivadavia 2581, Olavarría</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <a href="tel:+5492284322581" className="hover:text-white transition-colors">2284-322581</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Lun a Sáb: 8:00-14:00 y 16:00-21:00</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Categorias</h3>
              <ul className="space-y-2 text-sm">
                {categories.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => { setSelectedCategory(cat); setCurrentView('store'); }}
                      className="hover:text-white transition-colors"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p 
              className="text-xs cursor-pointer hover:text-stone-300 transition-colors" 
              onDoubleClick={() => setCurrentView('admin')}
              title="Doble clic para acceder al panel"
            >
              © {new Date().getFullYear()} La Familia Dietetica. Todos los derechos reservados.
            </p>
            <p className="text-xs">
              Hecho con <span className="text-emerald-500">amor</span> para tu salud
            </p>
          </div>
        </div>
      </footer>

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

      <WhatsAppButton />
    </div>
  );
}
