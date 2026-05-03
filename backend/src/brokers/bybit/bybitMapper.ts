export function toBybitSide(direction: 'long' | 'short'): 'Buy' | 'Sell' {
  return direction === 'long' ? 'Buy' : 'Sell';
}
