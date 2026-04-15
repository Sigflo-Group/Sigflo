const FRAMES = [
  { w: 'min(72vw, 520px)', h: 'min(48vh, 380px)', left: '-12%', top: '8%' },
  { w: 'min(55vw, 400px)', h: 'min(38vh, 300px)', left: '58%', top: '3%' },
  { w: 'min(65vw, 480px)', h: 'min(42vh, 340px)', left: '22%', top: '42%' },
  { w: 'min(48vw, 360px)', h: 'min(55vh, 400px)', left: '72%', top: '48%' },
  { w: 'min(80vw, 640px)', h: 'min(35vh, 260px)', left: '8%', top: '72%' },
  { w: 'min(42vw, 320px)', h: 'min(44vh, 320px)', left: '45%', top: '18%' },
  { w: 'min(58vw, 440px)', h: 'min(50vh, 360px)', left: '-18%', top: '55%' },
  { w: 'min(50vw, 380px)', h: 'min(40vh, 300px)', left: '68%', top: '78%' },
] as const;

export function LandingGeometricFrames() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FRAMES.map((f, i) => (
        <div
          key={i}
          className="absolute rounded-[1.75rem] border border-[rgba(0,200,120,0.045)] opacity-[0.042] sm:rounded-[2rem]"
          style={{
            width: f.w,
            height: f.h,
            left: f.left,
            top: f.top,
            boxShadow: 'inset 0 0 48px rgba(0,200,120,0.012)',
          }}
        />
      ))}
    </div>
  );
}
