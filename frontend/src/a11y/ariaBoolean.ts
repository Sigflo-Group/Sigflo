/** Literal ARIA boolean attribute objects for static a11y lint (Edge Tools / axe). */
export function ariaExpanded(open: boolean) {
  return open ? ({ 'aria-expanded': 'true' } as const) : ({ 'aria-expanded': 'false' } as const);
}

export function ariaSelected(selected: boolean) {
  return selected ? ({ 'aria-selected': 'true' } as const) : ({ 'aria-selected': 'false' } as const);
}

export function ariaPressed(pressed: boolean) {
  return pressed ? ({ 'aria-pressed': 'true' } as const) : ({ 'aria-pressed': 'false' } as const);
}
