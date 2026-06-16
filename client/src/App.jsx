import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext';
import { RoleRoute } from './guards/RoleRoute';
import { WholesaleRoute } from './guards/WholesaleRoute';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import TickerBanner from './components/home/TickerBanner';
import Acceso from './pages/Acceso';

import WholesaleApply from './pages/WholesaleApply';
import WholesaleLanding from './pages/WholesaleLanding';
import WholesalePortal from './pages/WholesalePortal';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminMetrics from './pages/admin/AdminMetrics';
import AdminMayoristas from './pages/admin/AdminMayoristas';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminProductos from './pages/admin/AdminProductos';
import AdminCombos from './pages/admin/AdminCombos';
import AdminGestionar from './pages/admin/AdminGestionar';
import AdminCalculadora from './pages/admin/AdminCalculadora';
import CalculadoraReporte from './pages/admin/calculadora/Reporte';
import CalculadoraCostos from './pages/admin/calculadora/Costos';
import CalculadoraGastos from './pages/admin/calculadora/Gastos';

import Tienda from './pages/Tienda';
import Producto from './pages/Producto';
import Checkout from './pages/Checkout';
import MiPedido from './pages/MiPedido';

import SetPassword from './pages/SetPassword.jsx';

import { usePageTracking } from "./hooks/usePageTracking";

function AppRoutes() {
  usePageTracking(); // Analytics de usuarios

  return (
    <>
      <ScrollToTop />
      <TickerBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Tienda />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/mi-pedido" element={<MiPedido />} />
        <Route path="/mi-pedido/:orderId" element={<MiPedido />} />
        <Route path="/aplicar-mayorista" element={<WholesaleApply />} />
        <Route path="/programa-mayorista" element={<WholesaleLanding />} />
        <Route
          path="/mayorista"
          element={
            <WholesaleRoute>
              <WholesalePortal />
            </WholesaleRoute>
          }
        />
        <Route path="/admin" element={<RoleRoute><AdminLayout /></RoleRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="metricas" element={<AdminMetrics />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="mayoristas" element={<AdminMayoristas />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="combos" element={<AdminCombos />} />
          <Route path="gestionar" element={<AdminGestionar />} />
          <Route path="calculadora" element={<AdminCalculadora />}>
            <Route index element={<CalculadoraReporte />} />
            <Route path="costos" element={<CalculadoraCostos />} />
            <Route path="gastos" element={<CalculadoraGastos />} />
          </Route>
        </Route>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;