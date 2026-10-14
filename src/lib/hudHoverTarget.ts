const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "summary",
  "select",
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="file"]',
  'input[type="submit"]',
  'input[type="button"]',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
].join(",")

const CARD_SELECTOR = ".ui-card-hover"

const EXCLUDED_SELECTOR = '[data-hud-hover="off"], .monaco-editor, [aria-hidden="true"]'

function isInactive(el: Element): boolean {
  if (el.matches(':disabled, [aria-disabled="true"]')) return true
  return getComputedStyle(el).pointerEvents === "none"
}

/** Resolves the hoverable control under the pointer, preferring nested controls over their catalog card. */
export function findHoverTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null
  if (target.closest(EXCLUDED_SELECTOR)) return null

  const interactive = target.closest(INTERACTIVE_SELECTOR)
  if (interactive) return isInactive(interactive) ? null : interactive

  return target.closest(CARD_SELECTOR)
}
