import { useState, useEffect } from 'react';
import { Clock, CheckCircle, ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { API_BASE } from '../config';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (data.success) {
        setToken(data.token);
        setPasswordError(false);
      } else {
        setPasswordError(true);
        setPasswordInput('');
      }
    } catch {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  const fetchOrders = async (authToken: string) => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setOrdersError(err.message || 'Error cargando pedidos');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders(token);
  }, [token]);

  const changeStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    } catch {
      alert('Error al actualizar el estado del pedido.');
    }
  };

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
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Contraseña"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                  passwordError ? 'border-red-400 bg-red-50' : 'border-stone-200'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1.5">
                  Contraseña incorrecta o error de conexión.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la tienda
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Panel de Pedidos</h1>
        </div>
        <button
          onClick={() => token && fetchOrders(token)}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-emerald-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {isLoadingOrders && (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Cargando pedidos...</p>
          </div>
        )}

        {!isLoadingOrders && ordersError && (
          <div className="p-8 text-center">
            <p className="text-red-500 font-medium mb-1">Error al cargar pedidos</p>
            <p className="text-stone-400 text-sm">{ordersError}</p>
            <button
              onClick={() => token && fetchOrders(token)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoadingOrders && !ordersError && orders.length === 0 && (
          <p className="p-8 text-center text-stone-500">Aún no hay pedidos registrados.</p>
        )}

        {!isLoadingOrders && !ordersError && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr>
                  <th className="p-4 font-semibold">Orden</th>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Productos</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50">
                    <td className="p-4 font-mono font-bold text-stone-900">{order.order_number}</td>
                    <td className="p-4 text-stone-500">
                      {new Date(order.created_at).toLocaleString('es-AR')}
                    </td>
                    <td className="p-4 text-stone-700">
                      {order.customer_info?.nombre && (
                        <p className="font-medium">{order.customer_info.nombre}</p>
                      )}
                      {order.customer_info?.telefono && (
                        <p className="text-xs text-stone-400">{order.customer_info.telefono}</p>
                      )}
                      {order.customer_info?.email && (
                        <p className="text-xs text-stone-400">{order.customer_info.email}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
                        {order.items.map((item: any, i: number) => (
                          <li key={i}>
                            {item.quantity}x {item.product.name}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">{formatPrice(order.total)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Pendiente'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {order.status === 'Pendiente' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.status === 'Pendiente' && (
                        <button
                          onClick={() => changeStatus(order.id, 'Entregado')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Marcar Entregado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
