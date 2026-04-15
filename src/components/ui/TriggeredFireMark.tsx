/** Fire emoji badge for triggered / just-triggered signal cards (markets + feed). */
export function TriggeredFireMark({ hot = false }: { hot?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 select-none leading-none ${
        hot
          ? 'text-[13px] [filter:drop-shadow(0_0_10px_rgba(255,130,50,0.75))]'
          : 'text-[11px] opacity-90 [filter:drop-shadow(0_0_5px_rgba(255,100,40,0.4))]'
      }`}
    >
      🔥
    </span>
  );
}
