import React from 'react';

type MenuItem = { id: number; name: string; description: string; price: number; imageUrl: string };

function priceFmt(v:number){ return (v/100).toFixed(2) + ' ₽'; }

export default function Home() {
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  const addToCart = (item: MenuItem) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((c: any) => c.menuItemId === item.id);
    if (existing) existing.quantity += 1; else cart.push({ menuItemId: item.id, quantity: 1, item });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  if (loading) return (
    <div>
      <div className="hero">
        <h1 className="hero-title">Меню</h1>
        <p className="hero-sub">Свежие блюда на мангале, быстрая доставка</p>
      </div>
      <div className="grid">
        {Array.from({length:6}).map((_,i)=> (
          <div className="card" key={i}>
            <div className="card-img"/>
            <div className="card-body">
              <div className="card-title" style={{background:'#202020',height:16,width:'80%',borderRadius:6}}/>
              <div style={{background:'#1a1a1a',height:12,width:'60%',borderRadius:6,marginTop:8}}/>
              <div className="card-footer" style={{marginTop:14}}>
                <div style={{background:'#202020',height:16,width:60,borderRadius:6}}/>
                <div style={{background:'#202020',height:34,width:110,borderRadius:10}}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="hero">
        <h1 className="hero-title">Меню</h1>
        <p className="hero-sub">Свежие блюда на мангале, быстрая доставка</p>
      </div>
      <div className="grid">
        {items.map((m) => (
          <div key={m.id} className="card">
            {m.imageUrl ? (
              <img className="card-img" src={m.imageUrl} alt={m.name} onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
            ) : (
              <div className="card-img" />
            )}
            <div className="card-body">
              <div className="card-title">{m.name}</div>
              <div className="card-desc">{m.description}</div>
              <div className="card-footer">
                <div className="price">{priceFmt(m.price)}</div>
                <button className="btn btn-primary" onClick={() => addToCart(m)}>В корзину</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
