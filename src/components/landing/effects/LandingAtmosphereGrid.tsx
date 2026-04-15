export function LandingAtmosphereGrid() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.052]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 200, 120, 0.17) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 120, 0.11) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245, 247, 250, 0.085) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 247, 250, 0.062) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.68]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 40%, rgba(0,200,120,0.016) 70%, transparent 100%)',
        }}
      />
    </div>
  );
}
