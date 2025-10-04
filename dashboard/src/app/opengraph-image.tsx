import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Consulate - Automated Dispute Resolution for AI Agents';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e2e8f0',
          padding: '80px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              background: '#3b82f6',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
            }}
          >
            ⚖️
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Consulate
          </div>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: '84px',
            fontWeight: '700',
            color: '#0f172a',
            lineHeight: 1.1,
            margin: '0 0 40px 0',
            textAlign: 'center',
            maxWidth: '1000px',
            letterSpacing: '-0.03em',
          }}
        >
          Resolve AI Agent Disputes
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '36px',
            color: '#475569',
            lineHeight: 1.4,
            margin: '0',
            textAlign: 'center',
            maxWidth: '800px',
            fontWeight: '500',
          }}
        >
          Automated arbitration for enterprise AI vendors
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}