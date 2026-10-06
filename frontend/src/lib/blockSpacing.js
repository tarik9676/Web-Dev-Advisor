// Spacing values are free-form CSS so authors can type exact units (px, %, rem,
// em, vh, vw, pt, ch) instead of picking a preset. Older records store the
// legacy presets ('none' | 'normal' | 'large'), which are mapped on read so
// existing content keeps rendering unchanged.

// Preset values are intentionally different per block type: text blocks pad
// vertically only, containers pad on all sides.
export const LEGACY_CONTAINER_PADDING = { none: '0', normal: '16px', large: '32px' };
export const LEGACY_TEXT_PADDING = { none: '0px', normal: '8px 0', large: '28px 0' };

const UNIT = 'px|%|rem|em|vh|vw|vmin|vmax|pt|pc|in|cm|mm|ch|ex|q';
const LENGTH = new RegExp(`^-?\\d*\\.?\\d+(${UNIT})$`, 'i');
// Unitless zero is valid CSS (padding: 0) and far more common than not.
const ZERO = /^[-+]?0*\.?0*$/;
const AUTO = /^auto$/i;

/**
 * True when `value` is usable as a CSS box value: 1-4 space separated lengths.
 * `auto` is only meaningful for margins (horizontal centring, `0 auto`), so it
 * is opt-in rather than accepted everywhere.
 */
function isValidBoxValue(value, allowAuto) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 1 || parts.length > 4) return false;
  return parts.every((part) => {
    if (AUTO.test(part)) return allowAuto;
    return LENGTH.test(part) || ZERO.test(part);
  });
}

/** Padding accepts 1-4 lengths. `auto` has no meaning for padding. */
export function isValidPaddingValue(value) {
  return isValidBoxValue(value, false);
}

/** Margin accepts 1-4 lengths and/or `auto`, e.g. `0 auto` to centre a box. */
export function isValidMarginValue(value) {
  return isValidBoxValue(value, true);
}

/**
 * Resolve a stored padding value to a CSS string.
 * Returns undefined for empty/invalid input so callers can fall back to their
 * own default rather than emitting broken CSS.
 */
export function resolvePaddingValue(value, legacyMap = LEGACY_CONTAINER_PADDING) {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (Object.prototype.hasOwnProperty.call(legacyMap, raw)) return legacyMap[raw];
  if (isValidPaddingValue(raw)) return raw;
  return undefined;
}

/**
 * Resolve a stored margin value. Margins have no legacy presets, so this only
 * accepts free-form CSS and returns undefined when unset or invalid.
 */
export function resolveMarginValue(value) {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  return isValidMarginValue(raw) ? raw : undefined;
}

/**
 * Margin for the per-block wrapper element.
 *
 * Container blocks carry `width` and `max-width` on their own root element, not
 * on the wrapper, so their margin has to sit there too. Split across two boxes,
 * a horizontal `auto` margin has no width of its own to centre and silently does
 * nothing. Every other block type is sized by its wrapper, so margin stays there.
 */
export function resolveWrapperMargin(block) {
  if (!block || typeof block !== 'object') return undefined;
  if (block.type === 'container') return undefined;
  return resolveMarginValue(block.margin);
}