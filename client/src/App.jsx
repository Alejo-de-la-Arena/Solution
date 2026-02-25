import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext';
import { RoleRoute } from './guards/RoleRoute';
import { WholesaleRoute } from './guards/WholesaleRoute';

import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Acceso from './pages/Acceso';

import WholesaleApply from './pages/WholesaleApply';
import WholesaleLanding from './pages/WholesaleLanding';
import WholesalePortal from './pages/WholesalePortal';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminMayoristas from './pages/admin/AdminMayoristas';
import AdminUsuarios from './pages/admin/AdminUsuarios';

import Tienda from './pages/Tienda';
import Producto from './pages/Producto';
import Checkout from './pages/Checkout';

import SetPassword from './pages/SetPassword.jsx';

import { usePageTracking } from "./hooks/usePageTracking";

function AppRoutes() {
  usePageTracking(); // Analytics de usuarios

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/checkout" element={<Checkout />} />
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
          <Route path="usuarios" element={<AdminUsuarios />} /> 
          <Route path="mayoristas" element={<AdminMayoristas />} />
        </Route>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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