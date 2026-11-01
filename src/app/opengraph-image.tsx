import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Md Zahid Hasan Patwary (Zahid) — Developer Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
          border: '12px solid #10b981',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            Z
          </div>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#f5f5f5' }}>
            0xZahidp
          </span>
        </div>

        <h1
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Md Zahid Hasan Patwary
        </h1>

        <p
          style={{
            fontSize: '28px',
            color: '#10b981',
            margin: '0 0 24px 0',
            fontWeight: 600,
          }}
        >
          Developer & Growth Strategist | Building SaaS & Web3 products
        </p>

        <p
          style={{
            fontSize: '20px',
            color: '#a1a1aa',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          CTO at Bidvers · Software Engineer at GymScanner · Agentic AI Builder
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
