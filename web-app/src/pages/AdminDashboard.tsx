import React from 'react';
import { useNavigate } from 'react-router-dom';

function useToken() {
  const [token] = React.useState(localStorage.getItem('token'));
  return token;
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const token = useToken();
  const [tab, setTab] = React.useState<'orders'|'couriers'|'stats'|'settings'|'menu'>('orders');

  React.useEffect(() => {
    if (!token) nav('/admin');
  }, [token]);

  return (
    <div>
      <h1>Панель администратора</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap:'wrap' }}>
        <button onClick={() => setTab('orders')} disabled={tab==='orders'}>Заказы</button>
        <button onClick={() => setTab('couriers')} disabled={tab==='couriers'}>Курьеры</button>
        <button onClick={() => setTab('stats')} disabled={tab==='stats'}>Статистика</button>
        <button onClick={() => setTab('settings')} disabled={tab==='settings'}>Настройки</button>
        <button onClick={() => setTab('menu')} disabled={tab==='menu'}>Меню</button>
      </div>
      {tab === 'orders' && <Orders />}
      {tab === 'couriers' && <Couriers />}
      {tab === 'stats' && <Stats />}
      {tab === 'settings' && <Settings />}
      {tab === 'menu' && <MenuEditor />}
    </div>
  );
}

function Orders() {
  const token = localStorage.getItem('token')!;
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [couriers, setCouriers] = React.useState<any[]>([]);

  const fetchData = async () => {
    const [o, c] = await Promise.all([
      fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch('/api/couriers', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json())
    ]);
    setOrders(o);
    setCouriers(c);
  };

  React.useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const statuses = ['PENDING','ACCEPTED','COOKING','ON_THE_WAY','DELIVERED','CANCELED'];
  // Live timers rerender
  const [, force] = React.useReducer(x=>x+1,0);
  React.useEffect(()=>{ const t = setInterval(force, 1000); return ()=>clearInterval(t); },[]);

  const updateOrder = async (id: number, patch: any) => {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(patch) });
    fetchData();
  };

  if (loading) return <p>Загрузка…</p>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {orders.map((o) => (
        <div key={o.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <b>№{o.id}</b> • {new Date(o.createdAt).toLocaleString()} • {(o.total/100).toFixed(2)} ₽ • ⏱ {fmtSince(o.createdAt)}
              <div style={{ color: '#555' }}>{o.customerName}, {o.phone}, {o.address}</div>
            </div>
            <div>
              <select value={o.status} onChange={(e)=>updateOrder(o.id,{ status: e.target.value })}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={o.courierId || ''} onChange={(e)=>updateOrder(o.id,{ courierId: e.target.value ? Number(e.target.value) : null })} style={{ marginLeft: 8 }}>
                <option value="">Без курьера</option>
                {couriers.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 8, color: '#333' }}>
            {o.items.map((it: any) => (
              <div key={it.id}>• {it.menuItem?.name} × {it.quantity}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Couriers() {
  const token = localStorage.getItem('token')!;
  const [list, setList] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const load = async () => {
    const c = await fetch('/api/couriers', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
    setList(c);
  };

  React.useEffect(() => { load(); }, []);

  const createCourier = async () => {
    if (!name || !phone) return;
    await fetch('/api/couriers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, phone }) });
    setName(''); setPhone('');
    load();
  };

  const toggleAvail = async (id: number, isAvailable: boolean) => {
    await fetch(`/api/couriers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isAvailable: !isAvailable }) });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Имя" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Телефон" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button onClick={createCourier}>Добавить</button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
            <div><b>{c.name}</b> — {c.phone}</div>
            <div>
              <span style={{ marginRight: 12 }}>{c.isAvailable ? 'Свободен' : 'Занят'}</span>
              <button onClick={() => toggleAvail(c.id, c.isAvailable)}>Переключить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stats() {
  const token = localStorage.getItem('token')!;
  const [data, setData] = React.useState<any | null>(null);
  const load = async () => setData(await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()));
  React.useEffect(() => { load(); }, []);
  // Live activity via SSE
  React.useEffect(() => {
    const es = new EventSource('/api/orders/stream', { withCredentials: false });
    es.onmessage = () => load();
    es.onerror = () => { /* ignore */ };
    return () => es.close();
  }, []);
  const refreshImages = async () => {
    const r = await fetch('/api/menu/refresh-images', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) alert('Картинки обновлены'); else alert('Не удалось обновить');
  }
  if (!data) return <p>Загрузка…</p>;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Box title="Всего заказов" value={data.totalOrders} />
        <Box title="Выручка" value={(data.totalRevenue/100).toFixed(2) + ' ₽'} />
        <Box title="Сегодня" value={data.todayOrders} />
        <Box title="За неделю" value={data.weekOrders} />
      </div>
      <Trend today={data.todayOrders} week={data.weekOrders} />
      <div className="panel">
        <h3 className="panel-title">Изображения меню</h3>
        <button className="btn btn-primary" onClick={refreshImages}>Обновить картинки (Pexels)</button>
      </div>
      <div>
        <h3>Топ блюда</h3>
        <ul>
          {data.topItems.map((t:any) => <li key={t.menuItemId}>{t.name} — {t.quantity}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Box({ title, value }: { title: string, value: any }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <div style={{ color: '#666', fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Trend({ today, week }: { today: number; week: number }){
  const items = [
    { label: 'Сегодня', value: today },
    { label: 'Неделя', value: week }
  ];
  const max = Math.max(1, ...items.map(i=>i.value));
  return (
    <div className="panel">
      <h3 className="panel-title">Активность</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12}}>
        {items.map(i=> (
          <div key={i.label} style={{background:'#0e0e0e',borderRadius:12,padding:12,boxShadow:'inset 0 0 0 1px #ffffff14'}}>
            <div style={{height:80, display:'flex',alignItems:'flex-end',gap:8}}>
              <div style={{width:'100%', background:'#1f2937', borderRadius:8, overflow:'hidden'}}>
                <div style={{height:`${(i.value/max)*80}px`, background:'linear-gradient(180deg,#f43f5e,#be123c)', width:'100%'}} />
              </div>
            </div>
            <div style={{marginTop:8, display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'#9aa1a6'}}>{i.label}</span>
              <b>{i.value}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtSince(dateStr:string){
  const d = new Date(dateStr).getTime();
  const s = Math.floor((Date.now()-d)/1000);
  const mm = Math.floor(s/60); const ss = s%60;
  const hh = Math.floor(mm/60); const m2 = mm%60;
  return hh>0? `${hh}ч ${m2}м` : `${mm}м ${ss}с`;
}

function MenuEditor() {
  const token = localStorage.getItem('token')!;
  const [list, setList] = React.useState<any[]>([]);
  const load = async () => setList(await fetch('/api/menu').then(r=>r.json()));
  React.useEffect(()=>{ load(); },[]);

  const save = async (m:any) => {
    await fetch(`/api/menu/${m.id}`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ name:m.name, description:m.description, price:Number(m.price), imageUrl:m.imageUrl })});
    load();
  };
  const del = async (id:number) => { if (!confirm('Удалить блюдо?')) return; await fetch(`/api/menu/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); load(); };

  return (
    <div className="panel">
      <h3 className="panel-title">Редактирование меню</h3>
      <div style={{display:'grid', gap:10}}>
        {list.map((m:any)=> (
          <div key={m.id} style={{display:'grid', gridTemplateColumns:'80px 1fr auto', gap:12, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #ffffff14'}}>
            {m.imageUrl && <img src={m.imageUrl} style={{width:80,height:60,objectFit:'cover',borderRadius:8}}/>}
            <div style={{display:'grid', gap:8}}>
              <input className="input" value={m.name} onChange={e=>setList(ls=>ls.map(x=>x.id===m.id?{...x,name:e.target.value}:x))} />
              <input className="input" value={m.description} onChange={e=>setList(ls=>ls.map(x=>x.id===m.id?{...x,description:e.target.value}:x))} />
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                <input className="input" value={m.price} onChange={e=>setList(ls=>ls.map(x=>x.id===m.id?{...x,price:e.target.value}:x))} />
                <input className="input" value={m.imageUrl} onChange={e=>setList(ls=>ls.map(x=>x.id===m.id?{...x,imageUrl:e.target.value}:x))} />
              </div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>save(m)}>Сохранить</button>
              <button className="btn" onClick={()=>del(m.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  const token = localStorage.getItem('token')!;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const form = new FormData();
    form.append('image', file);
    const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    if (!r.ok) { alert('Не удалось загрузить файл'); return null; }
    const d = await r.json();
    return d.url as string;
  };

  const createItem = async () => {
    let url = imageUrl;
    if (file) {
      const u = await uploadFile();
      if (u) url = u;
    }
    const body = { name, description, price: Number(price), imageUrl: url };
    const r = await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (r.ok) {
      alert('Блюдо создано');
      setName(''); setDescription(''); setPrice(''); setImageUrl(''); setFile(null);
    } else {
      alert('Ошибка создания');
    }
  };

  return (
    <div className="panel">
      <h3 className="panel-title">Добавить блюдо</h3>
      <div className="form">
        <input className="input" placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="Описание" value={description} onChange={e=>setDescription(e.target.value)} />
        <input className="input" placeholder="Цена (в копейках)" value={price} onChange={e=>setPrice(e.target.value)} />
        <input className="input" placeholder="Ссылка на изображение (необязательно)" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
        <input className="input" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <button className="btn btn-primary" onClick={createItem}>Создать</button>
      </div>
    </div>
  );
}
