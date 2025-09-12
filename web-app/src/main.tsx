import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './styles.css';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cart', element: <Cart /> },
      { path: 'account', element: <Account /> },
      { path: 'admin/dashboard', element: <AdminDashboard /> }
      ,{ path: 'privacy', element: <Privacy /> }
      ,{ path: 'terms', element: <Terms /> }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
