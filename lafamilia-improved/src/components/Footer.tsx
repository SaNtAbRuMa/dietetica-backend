import { MapPin, Clock, MessageCircle, Leaf, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../config';

interface FooterProps {
  onAdminAccess: () => void;
}

export function Footer({ onAdminAccess }: FooterProps) {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Quisiera hacer una consulta.')}`;

  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-serif text-lg font-bold text-white">La Familia Dietética</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-5">
              Tu dietética de confianza en Tandil. Productos naturales, frescos y de calidad para acompañar tu estilo de vida saludable.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-bold rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Escribinos por WhatsApp
            </a>
          </div>

          {/* Locales */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Nuestros Locales</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-stone-200">Urquiza 1315</p>
                  <p className="text-xs text-stone-500 mt-0.5">Tandil, Buenos Aires</p>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-stone-200">Rivadavia 2581</p>
                  <p className="text-xs text-stone-500 mt-0.5">Tandil, Buenos Aires</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-stone-200">2284-638849</p>
                  <p className="text-xs text-stone-500 mt-0.5">WhatsApp / Llamadas</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Horarios de Atención</h3>
            <ul className="space-y-3">
              {[
                { dia: 'Lunes a Viernes', hora: '9:00–13:00 y 17:00–21:00 hs' },
                { dia: 'Sábados',         hora: '9:00–13:00 hs' },
                { dia: 'Domingos',        hora: 'Cerrado' },
              ].map(({ dia, hora }) => (
                <li key={dia} className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-stone-200">{dia}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{hora}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-stone-600 leading-relaxed">
              Pedidos por WhatsApp también fuera del horario de atención.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} La Familia Dietética · Tandil, Buenos Aires
          </p>
          <p
            className="text-xs text-stone-800 cursor-pointer hover:text-stone-600 transition-colors select-none"
            onDoubleClick={onAdminAccess}
          >
            Administrar
          </p>
        </div>
      </div>
    </footer>
  );
}
