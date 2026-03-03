import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export function Hero() {
  return (
    <div id="inicio" className="relative bg-[url('https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat overflow-hidden">
      {/* Capa oscura superpuesta */}
      <div className="absolute inset-0 bg-stone-900/60 sm:bg-stone-900/50 sm:bg-gradient-to-r sm:from-stone-900/90 sm:to-stone-900/20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-16 px-4 sm:px-6 lg:px-8">
          <main className="mt-8 mx-auto max-w-7xl sm:mt-10 md:mt-14 lg:mt-16 xl:mt-20">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="sm:text-center lg:text-left"
            >
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-semibold rounded-full mb-4 backdrop-blur-sm"
              >
                <Leaf className="w-3.5 h-3.5" />
                Dietética Natural
              </motion.span>

              <h1 className="text-4xl tracking-tight font-serif font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Alimentación natural</span>{' '}
                <span className="block text-emerald-400 xl:inline">para tu bienestar</span>
              </h1>
              <p className="mt-4 text-base text-stone-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Seleccionamos los mejores productos naturales, frutos secos y cereales para acompañar tu estilo de vida saludable. Calidad y frescura en cada bocado.
              </p>

              <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
                <a href="#productos" className="flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 md:py-4 md:text-lg md:px-10 transition-colors shadow-lg hover:shadow-xl">
                  Ver Productos
                </a>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}