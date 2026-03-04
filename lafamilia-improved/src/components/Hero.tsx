import { motion } from 'motion/react';
import { Leaf, Truck, MapPin, Clock, Sparkles } from 'lucide-react';

const BENEFITS = [
  { icon: Truck,    label: 'Envío a domicilio',    sub: 'Gratis desde $20.000' },
  { icon: MapPin,   label: 'Retiro en local',       sub: 'Urquiza 1315 · Rivadavia 2581' },
  { icon: Clock,    label: 'Lun–Vie 9–13 / 17–21', sub: 'Sáb 9–13 hs' },
  { icon: Sparkles, label: '500+ productos',        sub: 'Catálogo actualizado' },
];

export function Hero() {
  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="inicio">
      {/* Banner */}
      <div className="relative min-h-[420px] sm:min-h-[500px] flex items-center bg-[url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-stone-900/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-lg"
          >
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-sm font-semibold rounded-full mb-5 backdrop-blur-sm"
            >
              <Leaf className="w-3.5 h-3.5" />
              Dietética Natural · Olavarría
            </motion.span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-white leading-tight">
              Alimentación natural
              <span className="block text-emerald-400">para tu bienestar</span>
            </h1>

            <p className="mt-4 text-stone-200 text-base sm:text-lg leading-relaxed">
              Frutos secos, cereales, semillas, suplementos y mucho más. Calidad y frescura garantizadas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* Botón JS scroll — no usa href para no romper el hash router */}
              <button
                onClick={scrollToProducts}
                className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg text-sm sm:text-base"
              >
                Ver productos
              </button>
              <a
                href={`https://wa.me/5492284638849?text=${encodeURIComponent('Hola! Quisiera hacer una consulta.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-xl transition-all border border-white/25 backdrop-blur-sm text-sm sm:text-base"
              >
                Consultar por WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Franja de beneficios */}
      <div className="bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-stone-100">
            {BENEFITS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 py-4 px-3 sm:px-5">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-sm font-bold text-stone-900 leading-snug">{label}</p>
                  <p className="text-[10px] sm:text-xs text-stone-400 leading-tight mt-0.5 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
