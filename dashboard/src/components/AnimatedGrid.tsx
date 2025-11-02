"use client"

interface AnimatedGridProps {
  color?: string
}

export function AnimatedGrid({ color = '#10b981' }: AnimatedGridProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle animated grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000, transparent)'
        }}
      />
      
      {/* Floating orbs with gentle pulse */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Subtle scan line effect for tech feel */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)',
          animation: 'scan 8s linear infinite'
        }}
      />

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  )
}

