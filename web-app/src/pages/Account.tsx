import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const nav = useNavigate();
  const [me, setMe] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setMe(await r.json());
    } finally { setLoading(false); }
  };

  React.useEffect(() => { fetchMe(); }, []);

  if (loading) return <p>Загрузка…</p>;

  const logout = () => { localStorage.removeItem('token'); setMe(null); };

  if (me?.role === 'admin') {
    return (
      <div className="panel">
        <h1 className="panel-title">Администратор</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" onClick={() => nav('/admin/dashboard')}>Открыть панель</button>
          <button className="btn" onClick={logout}>Выйти</button>
        </div>
      </div>
    );
  }

  if (me?.role === 'user') {
    return (
      <div className="panel">
        <h1 className="panel-title">Мой профиль</h1>
        <div>Имя: <b>{me.user?.name}</b></div>
        <div>Телефон: <b>{me.user?.phone}</b></div>
        <div style={{marginTop:10}}>
          <button className="btn" onClick={logout}>Выйти</button>
        </div>
        <h3 style={{marginTop:12}}>Мои заказы</h3>
        <ul>
          {me.orders?.map((o:any)=> <li key={o.id}>№{o.id} — {(o.total/100).toFixed(2)} ₽ — {new Date(o.createdAt).toLocaleString()}</li>)}
        </ul>
      </div>
    );
  }

  return <LoginForms onLogin={fetchMe} />;
}

function LoginForms({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [agree, setAgree] = React.useState(false);

  const submit = async () => {
    try {
      if (username && password) {
        // admin path
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (!r.ok) return alert('Неверные админ‑данные');
        const data = await r.json();
        localStorage.setItem('token', data.token);
        onLogin();
        return;
      }
      if (!phone) return alert('Укажите телефон');
      if (!agree) return alert('Подтвердите согласие с политикой и соглашением');
      const r = await fetch('/api/auth/user-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, name, acceptTerms: true }) });
      if (!r.ok) return alert('Не удалось войти');
      const data = await r.json();
      localStorage.setItem('token', data.token);
      onLogin();
    } catch {
      alert('Ошибка входа');
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Вход в аккаунт</h2>
      <div className="form">
        <input className="input" placeholder="Телефон (для клиентов)" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="input" placeholder="Имя (необязательно)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="Логин (для админа)" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Пароль (для админа)" value={password} onChange={e=>setPassword(e.target.value)} />
        <label style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
          <span>Соглашаюсь с <a href="/privacy" target="_blank">политикой</a> и <a href="/terms" target="_blank">соглашением</a></span>
        </label>
        <button className="btn btn-primary" onClick={submit}>Войти</button>
      </div>
    </div>
  );
}
