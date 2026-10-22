import React from 'react';
import { peso } from '../types';

export const DeviceIconSvg: React.FC<{ model: string }> = ({ model }) => {
  if (/ipad|tab/i.test(model || '')) {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M18.5 0h-14C3.12 0 2 1.12 2 2.5v19C2 22.88 3.12 24 4.5 24h14c1.38 0 2.5-1.12 2.5-2.5v-19C21 1.12 19.88 0 18.5 0zm-7 23c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7.5-4H4V3h15v16z" />
      </svg>
    );
  }
  if (/airpod/i.test(model || '')) {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24">
      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
    </svg>
  );
};

export const BarcodeSvg: React.FC<{ code: string; height?: number }> = ({ code, height = 36 }) => {
  const str = String(code || 'LPG-000').toUpperCase();
  const bars: number[] = [2, 1, 1, 2, 1, 2];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    bars.push(((c >> 4) & 3) + 1);
    bars.push((c & 3) + 1);
    bars.push(((c >> 2) & 2) + 1);
    bars.push(((c + i) % 3) + 1);
  }
  bars.push(2, 1, 2, 1, 1, 2);

  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const unitW = 1.55;
  const width = Math.ceil(totalUnits * unitW) + 8;

  let x = 4;
  const rects: React.ReactNode[] = [];
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i] * unitW;
    if (i % 2 === 0) {
      rects.push(
        <rect
          key={i}
          x={x.toFixed(1)}
          y="2"
          width={w.toFixed(1)}
          height={height}
          fill="#18181b"
        />,
      );
    }
    x += w;
  }

  return (
    <svg
      width="100%"
      height={height + 4}
      viewBox={`0 0 ${width} ${height + 4}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '190px' }}
    >
      {rects}
    </svg>
  );
};

export const StickerCard: React.FC<{ item: any; showPrice?: boolean }> = ({
  item,
  showPrice = true,
}) => {
  return (
    <div className="sticker-item">
      <div
        style={{
          fontSize: '0.64rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#71717a',
        }}
      >
        LOOP PLACE GADGETS
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#18181b' }}>{item.model}</div>
      <div style={{ fontSize: '0.74rem', color: '#52525b', fontWeight: 600 }}>
        {item.storage} • {item.color}
      </div>
      <BarcodeSvg code={item.sku} height={36} />
      <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 800 }}>
        {item.sku}
      </div>
      {showPrice ? (
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
          {peso(item.sellingPrice)}
        </div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>Stock: {item.quantity} pcs</div>
      )}
    </div>
  );
};
