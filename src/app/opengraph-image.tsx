import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Al Nahian — Developer Profile | FolioFrame';
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
              color: '#000',
            }}
          >
            N
          </div>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#f5f5f5' }}>
            nahian.bd
          </span>
        </div>

        <h1
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Al Nahian
        </h1>

        <p
          style={{
            fontSize: '32px',
            color: '#10b981',
            margin: '0 0 24px 0',
            fontWeight: 600,
          }}
        >
          Less talk, show me code!
        </p>

        <p
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Founding Engineer · CTO at Bidvers · Software Engineer at GymScanner · Agentic AI Builder
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}

