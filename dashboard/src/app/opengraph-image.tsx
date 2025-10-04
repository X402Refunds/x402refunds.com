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
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-900
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Decorative Elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(-20%, 20%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              ⚖️
            </div>
            <div
              style={{
                fontSize: '42px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              Consulate
            </div>
          </div>

          {/* Main Headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '900px',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              Resolve AI Agent Disputes in{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Minutes
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '28px',
              color: '#94a3b8', // slate-400
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '800px',
            }}
          >
            Automated arbitration for enterprise AI service agreements and SLA violations
          </p>

          {/* Stats Bar */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#10b981', // emerald-500
                }}
              >
                2.4 min
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#cbd5e1', // slate-300
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Avg Resolution
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#3b82f6', // blue-500
                }}
              >
                95% Savings
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#cbd5e1', // slate-300
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                vs Legal Costs
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#f59e0b', // amber-500
                }}
              >
                24/7 Live
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#cbd5e1', // slate-300
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Production API
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '100px',
            padding: '12px 24px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
            }}
          />
          <span
            style={{
              fontSize: '18px',
              color: '#10b981',
              fontWeight: '600',
            }}
          >
            Live Production System
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
