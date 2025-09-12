import React from 'react';

function priceFmt(v:number){ return (v/100).toFixed(2) + ' ₽'; }

export default function Cart() {
  const [cart, setCart] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ name: '', phone: '', address: '', comment: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const [orderId, setOrderId] = React.useState<number | null>(null);
  const [agree, setAgree] = React.useState(false);

  React.useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
  }, []);

  const updateQty = (id: number, delta: number) => {
    const next = cart.map((i) => i.menuItemId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (id: number) => {
    const next = cart.filter((i) => i.menuItemId !== id);
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  const total = cart.reduce((s, i) => s + (i.item?.price || 0) * i.quantity, 0);

  const submit = async () => {
    if (!form.name || !form.phone || !form.address || cart.length === 0) return alert('Заполните данные и корзину');
    if (!agree) return alert('Подтвердите согласие с политикой и соглашением');
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          address: form.address,
          comment: form.comment,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
          acceptTerms: true
        })
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const order = data.order || data;
      if (data.userToken) localStorage.setItem('token', data.userToken);
      setOrderId(order.id);
      localStorage.removeItem('cart');
      setCart([]);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      alert('Ошибка оформления заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) return <div className="panel"><h1 className="panel-title">Спасибо!</h1><p>Ваш заказ №{orderId} принят.</p></div>;

  return (
    <div>
      <div className="hero">
        <h1 className="hero-title">Корзина</h1>
        <p className="hero-sub">Проверьте заказ и заполните данные доставки</p>
      </div>
      {cart.length === 0 ? <p className="hero-sub" style={{marginTop:12}}>Пусто</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
          <div className="panel">
            {cart.map((i) => (
              <div key={i.menuItemId} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #ffffff14' }}>
                {i.item?.imageUrl && <img src={i.item.imageUrl} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />}
                <div>
                  <div style={{ fontWeight: 700 }}>{i.item?.name}</div>
                  <div style={{ color: '#9aa1a6' }}>{priceFmt(i.item?.price ?? 0)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn" onClick={() => updateQty(i.menuItemId, -1)}>-</button>
                  <span>{i.quantity}</span>
                  <button className="btn" onClick={() => updateQty(i.menuItemId, +1)}>+</button>
                  <button className="btn" onClick={() => removeItem(i.menuItemId)} style={{ marginLeft: 8 }}>Удалить</button>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontSize: 18, marginTop: 12 }}>Итого: <b>{priceFmt(total)}</b></div>
          </div>
          <div className="panel">
            <h3 className="panel-title">Данные для доставки</h3>
            <div className="form">
              <input className="input" placeholder="Имя" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input" placeholder="Адрес" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <textarea className="textarea" placeholder="Комментарий" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
              <label style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                <span>Соглашаюсь с <a href="/privacy" target="_blank">политикой</a> и <a href="/terms" target="_blank">соглашением</a></span>
              </label>
              <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Отправка…' : 'Оформить заказ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
