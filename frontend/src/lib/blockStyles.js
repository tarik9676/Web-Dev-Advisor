// Free-form CSS values for block styling (width, font size, colour, border).
// Older records store preset keys like 'full' or 'large', which are mapped on
// read so existing content keeps rendering unchanged.

import { isValidPaddingValue } from './blockSpacing.js';

const UNIT = 'px|%|rem|em|vh|vw|vmin|vmax|pt|pc|in|cm|mm|ch|ex|q';
const LENGTH = new RegExp(`^-?\\d*\\.?\\d+(${UNIT})$`, 'i');
const ZERO = /^[-+]?0*\.?0*$/;

function isLength(part) {
  return LENGTH.test(part) || ZERO.test(part);
}

/** A CSS width: a length, a percentage, or the keywords we support. */
export function isValidWidthValue(value) {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw) return false;
  if (/^(auto|100vw|100vh)$/i.test(raw)) return true;
  if (isLength(raw)) return true;
  // Multi-value is meaningless for width; reject rather than emit broken CSS.
  return false;
}

/** A CSS font-size: a length, or one of the absolute-size keywords. */
export function isValidFontSizeValue(value) {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw) return false;
  if (/^(xx-small|x-small|small|medium|large|x-large|xx-large|larger|smaller)$/i.test(raw)) return true;
  return isLength(raw);
}

const COLOR_FN = '(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|var)';
const GRADIENT_FN = '(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient)';

/**
 * A CSS colour value: hex, functional notation, var(), a gradient, or a plain
 * keyword such as "transparent". Deliberately rejects anything containing
 * statement terminators so the value cannot break out of the declaration.
 */
export function isValidColorValue(value) {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw || raw.length > 200) return false;
  if (/[;{}<>]/.test(raw)) return false;
  if (/url\s*\(/i.test(raw)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return true;
  if (new RegExp(`^${COLOR_FN}\\(`, 'i').test(raw)) return true;
  if (new RegExp(`^${GRADIENT_FN}\\(`, 'i').test(raw)) return true;
  // Bare keywords: transparent, red, rebeccapurple, currentColor, inherit...
  return /^[a-z][a-z0-9-]{0,30}$/i.test(raw);
}

/** A CSS border-radius: 1-4 lengths. */
export function isValidRadiusValue(value) {
  return isValidPaddingValue(value);
}

/** A CSS border shorthand: width + style [+ colour]. */
export function isValidBorderValue(value) {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw || raw.length > 120) return false;
  if (/[;{}<>]/.test(raw)) return false;
  if (!isValidWidthValue(raw.split(/\s+/)[0] || '')) return false;
  return /^(none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/i.test(raw.split(/\s+/)[1] || '');
}

const LEGACY_IMAGE_WIDTH = { full: '100%', wide: '100%', normal: '70%', half: '50%' };
// Containers previously offered a fixed percentage list; all of those values are
// already valid CSS, so they pass through unchanged.
export const LEGACY_CONTAINER_WIDTH = {};
const LEGACY_HEADING_SIZE = { small: '18px', default: '24px', large: '32px' };

function resolve(value, isValid, legacyMap) {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (legacyMap && Object.prototype.hasOwnProperty.call(legacyMap, raw)) return legacyMap[raw];
  return isValid(raw) ? raw : undefined;
}

export function resolveWidthValue(value, legacyMap = LEGACY_IMAGE_WIDTH) {
  return resolve(value, isValidWidthValue, legacyMap);
}

export function resolveFontSizeValue(value) {
  return resolve(value, isValidFontSizeValue, LEGACY_HEADING_SIZE);
}

export function resolveColorValue(value) {
  return resolve(value, isValidColorValue, null);
}

export function resolveBorderValue(value) {
  return resolve(value, isValidBorderValue, null);
}

export function resolveBorderRadiusValue(value) {
  return resolve(value, isValidRadiusValue, null);
}