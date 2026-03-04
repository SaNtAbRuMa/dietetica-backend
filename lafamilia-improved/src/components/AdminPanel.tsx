import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Lock, RefreshCw, Search, X,
  ShoppingBag, TrendingUp, Clock, CheckCircle2,
  Truck, Store, Banknote, Landmark, CreditCard,
  ChevronDown, AlertCircle, Package, XCircle,
} from 'lucide-react';
import { formatPrice } from '../utils/format';
import { API_BASE } from '../config';

interface AdminPanelProps { onBack: () => void; }

// ── Tipos ────────────────────────────────────────────────────
interface Order {
  id: number;
  order_number: string;
  total: string;
  status: string;
  items: { quantity: number; product: { name: string; price: number } }[];
  customer_info: { nombre?: string; telefono?: string; email?: string; direccion?: string };
  delivery_method?: string;
  payment_method?: string;
  created_at: string;
}
interface Stats {
  total:   { count: number; revenue: number };
  pending: { count: number };
  today:   { count: number; revenue: number };
  byStatus: { status: string; count: string }[];
}

// ── Config de estados ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pendiente:       { label: 'Pendiente',       color: 'text-amber-700',    bg: 'bg-amber-50',    border: 'border-amber-200', dot: 'bg-amber-500' },
  pendiente_pago:  { label: 'Esperando pago',  color: 'text-blue-700',     bg: 'bg-blue-50',     border: 'border-blue-200',  dot: 'bg-blue-500' },
  pagado:          { label: 'Pagado ✓',         color: 'text-emerald-700',  bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  pago_pendiente:  { label: 'Pago en revisión', color: 'text-orange-700',   bg: 'bg-orange-50',   border: 'border-orange-200', dot: 'bg-orange-500' },
  pago_rechazado:  { label: 'Pago rechazado',  color: 'text-red-700',      bg: 'bg-red-50',      border: 'border-red-200',   dot: 'bg-red-500' },
  confirmado:      { label: 'Confirmado',      color: 'text-teal-700',     bg: 'bg-teal-50',     border: 'border-teal-200',  dot: 'bg-teal-500' },
  en_camino:       { label: 'En camino',       color: 'text-violet-700',   bg: 'bg-violet-50',   border: 'border-violet-200', dot: 'bg-violet-500' },
  entregado:       { label: 'Entregado',       color: 'text-stone-600',    bg: 'bg-stone-100',   border: 'border-stone-200', dot: 'bg-stone-400' },
  cancelado:       { label: 'Cancelado',       color: 'text-red-500',      bg: 'bg-red-50',      border: 'border-red-100',   dot: 'bg-red-400' },
};

// Flujo de transiciones permitidas por estado
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pendiente:      ['confirmado', 'cancelado'],
  pendiente_pago: ['confirmado', 'cancelado'],
  pagado:         ['confirmado', 'cancelado'],
  pago_pendiente: ['confirmado', 'cancelado'],
  pago_rechazado: ['cancelado'],
  confirmado:     ['en_camino', 'entregado', 'cancelado'],
  en_camino:      ['entregado', 'cancelado'],
  entregado:      [],
  cancelado:      [],
};

const PAYMENT_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  transfer:    { icon: Landmark,    label: 'Transferencia' },
  mercadopago: { icon: CreditCard,  label: 'MercadoPago' },
  cash:        { icon: Banknote,    label: 'Efectivo' },
};
const DELIVERY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  delivery: { icon: Truck,  label: 'Envío' },
  pickup:   { icon: Store,  label: 'Retiro' },
};

const FILTER_TABS = [
  { value: 'todos',         label: 'Todos' },
  { value: 'pendiente',     label: 'Pendiente' },
  { value: 'pendiente_pago',label: 'Esp. pago' },
  { value: 'pagado',        label: 'Pagado' },
  { value: 'confirmado',    label: 'Confirmado' },
  { value: 'en_camino',     label: 'En camino' },
  { value: 'entregado',     label: 'Entregado' },
  { value: 'cancelado',     label: 'Cancelado' },
];

// ── Componente badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Dropdown cambio de estado ─────────────────────────────────
function StatusDropdown({ order, onChangeStatus }: { order: Order; onChangeStatus: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  if (transitions.length === 0) return <StatusBadge status={order.status} />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 group"
      >
        <StatusBadge status={order.status} />
        <ChevronDown className={`w-3 h-3 text-stone-400 group-hover:text-stone-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-44 py-1">
            {transitions.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChangeStatus(order.id, s); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors ${cfg?.color ?? 'text-stone-700'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg?.dot ?? 'bg-stone-400'}`} />
                  {cfg?.label ?? s}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Card de pedido ─────────────────────────────────────────────
function OrderCard({ order, onChangeStatus }: { order: Order; onChangeStatus: (id: number, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const date      = new Date(order.created_at);
  const dateStr   = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  const timeStr   = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const payment   = PAYMENT_ICONS[order.payment_method ?? ''];
  const delivery  = DELIVERY_ICONS[order.delivery_method ?? ''];
  const PayIcon   = payment?.icon;
  const DelIcon   = delivery?.icon;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header del card */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono font-bold text-stone-900 text-sm shrink-0">{order.order_number}</span>
            <span className="text-xs text-stone-400 shrink-0">{dateStr} · {timeStr}</span>
          </div>
          <StatusDropdown order={order} onChangeStatus={onChangeStatus} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 truncate">{order.customer_info.nombre ?? '—'}</p>
            <p className="text-xs text-stone-400 truncate">{order.customer_info.telefono}</p>
          </div>
          <p className="text-xl font-bold text-emerald-700 shrink-0">{formatPrice(parseFloat(order.total))}</p>
        </div>

        {/* Iconos de método */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {PayIcon && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-100 px-2 py-1 rounded-lg">
              <PayIcon className="w-3 h-3" /> {payment.label}
            </span>
          )}
          {DelIcon && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-100 px-2 py-1 rounded-lg">
              <DelIcon className="w-3 h-3" /> {delivery.label}
            </span>
          )}
          {order.customer_info.direccion && (
            <span className="text-xs text-stone-400 truncate max-w-[180px]">📍 {order.customer_info.direccion}</span>
          )}
        </div>
      </div>

      {/* Items expandibles */}
      <div className="border-t border-stone-100">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <span>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <ul className="px-4 sm:px-5 pb-4 space-y-1.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-xs text-stone-600">
                <span className="truncate pr-2"><span className="text-stone-400">{item.quantity}x</span> {item.product.name}</span>
                <span className="text-stone-900 font-medium shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────
export function AdminPanel({ onBack }: AdminPanelProps) {
  const [token, setToken]   = useState<string | null>(() => sessionStorage.getItem('lf-admin-token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isLoggingIn, setIsLoggingIn]     = useState(false);

  const [orders, setOrders]         = useState<Order[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [activeTab, setActiveTab]   = useState('todos');
  const [search, setSearch]         = useState('');

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('lf-admin-token', data.token);
        setToken(data.token);
        setPasswordError(false);
      } else {
        setPasswordError(true);
        setPasswordInput('');
      }
    } catch {
      setPasswordError(true);
      setPasswordInput('');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ── Fetch datos ────────────────────────────────────────────
  const fetchAll = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setOrdersError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'todos') params.set('status', activeTab);
      if (search.trim())         params.set('search', search.trim());

      const [ordersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders?${params}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`${API_BASE}/api/orders/stats`,     { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);
      if (!ordersRes.ok) throw new Error(`HTTP ${ordersRes.status}`);
      const [ordersData, statsData] = await Promise.all([ordersRes.json(), statsRes.json()]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (err: any) {
      setOrdersError(err.message || 'Error cargando pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { if (token) fetchAll(token); }, [token, fetchAll]);

  const changeStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      // Refrescar stats tras cambio de estado
      if (token) {
        fetch(`${API_BASE}/api/orders/stats`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(setStats).catch(() => {});
      }
    } catch {
      alert('Error al actualizar el estado del pedido.');
    }
  };

  // ── Pantalla de login ──────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">Panel de Admin</h1>
            <p className="text-stone-500 text-sm mt-1">Ingresá la contraseña para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password" value={passwordInput} autoFocus
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
              placeholder="Contraseña"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${passwordError ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
            />
            {passwordError && <p className="text-red-500 text-sm">Contraseña incorrecta o error de conexión.</p>}
            <button type="submit" disabled={isLoggingIn}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {isLoggingIn ? <><RefreshCw className="w-4 h-4 animate-spin" /> Ingresando...</> : 'Ingresar'}
            </button>
            <button type="button" onClick={onBack}
              className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver a la tienda
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <h1 className="font-serif font-bold text-stone-900 text-lg">Panel de Pedidos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => token && fetchAll(token)}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:block">Actualizar</span>
            </button>
            <button onClick={() => { sessionStorage.removeItem('lf-admin-token'); setToken(null); }}
              className="text-sm text-stone-500 hover:text-red-500 border border-stone-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Pedidos hoy',
                value: stats.today.count.toString(),
                sub:   formatPrice(stats.today.revenue),
                icon:  ShoppingBag,
                color: 'text-emerald-600',
                bg:    'bg-emerald-50',
              },
              {
                label: 'Activos',
                value: stats.pending.count.toString(),
                sub:   'pendiente / confirmado / en camino',
                icon:  Clock,
                color: 'text-amber-600',
                bg:    'bg-amber-50',
              },
              {
                label: 'Total histórico',
                value: stats.total.count.toString(),
                sub:   'pedidos registrados',
                icon:  Package,
                color: 'text-violet-600',
                bg:    'bg-violet-50',
              },
              {
                label: 'Ingresos totales',
                value: formatPrice(stats.total.revenue),
                sub:   'todos los pedidos',
                icon:  TrendingUp,
                color: 'text-blue-600',
                bg:    'bg-blue-50',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 font-medium">{label}</p>
                  <p className={`font-bold text-lg leading-tight ${color} truncate`}>{value}</p>
                  <p className="text-[10px] text-stone-400 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text" value={search} placeholder="Buscar pedido o cliente..."
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs de estado */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map(tab => {
              const count = tab.value === 'todos'
                ? stats?.total.count
                : stats?.byStatus.find(s => s.status === tab.value)?.count;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.value
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-1.5 px-1 rounded-full text-[10px] font-bold ${activeTab === tab.value ? 'bg-white/20' : 'bg-stone-100'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de pedidos */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Cargando pedidos...</p>
          </div>
        )}

        {!isLoading && ordersError && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-semibold mb-1">Error al cargar pedidos</p>
            <p className="text-stone-400 text-sm mb-4">{ordersError}</p>
            <button onClick={() => token && fetchAll(token)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !ordersError && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <XCircle className="w-12 h-12 text-stone-200 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No hay pedidos</p>
            <p className="text-stone-400 text-sm mt-1">
              {activeTab !== 'todos' || search ? 'Probá con otros filtros' : 'Aún no hay pedidos registrados'}
            </p>
          </div>
        )}

        {!isLoading && !ordersError && orders.length > 0 && (
          <>
            <p className="text-xs text-stone-400 pl-1">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
              {activeTab !== 'todos' ? ` · ${STATUS_CONFIG[activeTab]?.label ?? activeTab}` : ''}
              {search ? ` · "${search}"` : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} onChangeStatus={changeStatus} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
