import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import logo from './logo.svg';
import React from 'react';

function useCartCount() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const sync = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCount(cart.reduce((s: number, i: any) => s + Number(i.quantity || 1), 0));
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return count;
}

export default function App() {
  const count = useCartCount();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthed = Boolean(localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/account');
  };

  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="brand">
          <img src={logo} width={34} height={34} className="brand-badge" style={{background:'transparent'}} />
          <div className="brand-title">Шашлык Машлык</div>
        </Link>
        <nav className="nav">
          <Link className="btn" to="/cart"><ShoppingCart size={16} style={{marginRight:6}}/>Корзина ({count})</Link>
          <Link className="btn" to="/account"><User size={16} style={{marginRight:6}}/>Аккаунт</Link>
          {isAuthed && <button className="btn" onClick={logout}>Выйти</button>}
        </nav>
      </header>
      <Outlet />
      <footer className="footer">© {new Date().getFullYear()} Шашлык Машлык · <a href="/privacy">Политика конфиденциальности</a> · <a href="/terms">Соглашение</a></footer>
    </div>
  );
}
