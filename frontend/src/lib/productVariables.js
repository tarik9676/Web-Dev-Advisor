// Product field variables usable inside canvas block content.
//
// Author a token like {{product.name}} in any block text, link, image alt or
// caption and it is replaced with the live product value at render time. The
// same tokens resolve in the admin canvas preview, so edits to product details
// are reflected without saving.

import { createVariableScope, variableToken } from '../context/BlockVariableContext.jsx';

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
// Separate non-global pattern: reusing a /g regex with .test() advances
// lastIndex and makes repeated calls return inconsistent results.
const TOKEN_PROBE_RE = /\{\{\s*[a-zA-Z0-9_.]+\s*\}\}/;

const CURRENCY_SYMBOLS = { USD: '$', EUR: '\u20ac', GBP: '\u00a3', INR: '\u20b9' };

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === '') return '';
  const symbol = CURRENCY_SYMBOLS[currency] || '';
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return String(amount);
  const fixed = numeric.toFixed(2).replace(/\.00$/, '');
  return symbol ? `${symbol}${fixed}` : `${fixed} ${currency || ''}`.trim();
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function joinList(value, separator = ', ') {
  return asList(value).filter(Boolean).join(separator);
}

/**
 * Catalog shown in the editor's "Insert variable" picker.
 * `token` is what gets written into the block; `example` previews the output.
 */
export const PRODUCT_VARIABLE_GROUPS = [
  {
    group: 'Basics',
    variables: [
      { token: 'product.name', label: 'Product name', example: 'Advanced Subscriptions' },
      { token: 'product.short_description', label: 'Short description', example: 'One-line pitch' },
      { token: 'product.description', label: 'Full description', example: 'Long overview copy' },
      { token: 'product.version', label: 'Version', example: '1.0.0' },
    ],
  },
  {
    group: 'Pricing',
    variables: [
      { token: 'product.price', label: 'Price (raw)', example: '99.00' },
      { token: 'product.price_formatted', label: 'Price (formatted)', example: '$99' },
      { token: 'product.current_price', label: 'Current price (sale applied)', example: '$79' },
      { token: 'product.current_price_formatted', label: 'Current price (formatted)', example: '$79' },
      { token: 'product.sale_price', label: 'Sale price (raw)', example: '79.00' },
      { token: 'product.sale_price_formatted', label: 'Sale price (formatted)', example: '$79' },
      { token: 'product.currency', label: 'Currency', example: 'USD' },
      { token: 'product.billing_type', label: 'Billing type', example: 'monthly' },
      { token: 'product.license_type', label: 'License type', example: 'single' },
    ],
  },
  {
    group: 'Links',
    variables: [
      { token: 'product.product_url', label: 'Product page URL', example: '/products/slug' },
      { token: 'product.landing_url', label: 'Landing page URL', example: '/p/slug' },
      { token: 'product.documentation_url', label: 'Documentation URL', example: 'https://…' },
      { token: 'product.demo_url', label: 'Demo URL', example: 'https://…' },
      { token: 'product.checkout_url', label: 'Checkout URL', example: '/products/slug?buy=1' },
    ],
  },
  {
    group: 'Media',
    variables: [
      { token: 'product.thumbnail', label: 'Thumbnail image URL', example: 'https://…' },
      { token: 'product.category_name', label: 'Category name', example: 'Subscription' },
      { token: 'product.category_slug', label: 'Category slug', example: 'subscription' },
    ],
  },
  {
    group: 'Meta',
    variables: [
      { token: 'product.status', label: 'Status', example: 'published' },
      { token: 'product.is_featured', label: 'Featured', example: 'true' },
      { token: 'product.tags_joined', label: 'Tags (comma separated)', example: 'stripe, billing' },
      { token: 'product.features_count', label: 'Feature count', example: '6' },
      { token: 'product.download_limit', label: 'Download limit', example: '0' },
      { token: 'product.download_expiry_days', label: 'Download expiry (days)', example: '365' },
      { token: 'product.updated_at', label: 'Last updated', example: '2026-10-03' },
    ],
  },
];

export const PRODUCT_VARIABLES = PRODUCT_VARIABLE_GROUPS.flatMap((g) => g.variables);

const VARIABLE_TOKENS = new Set(PRODUCT_VARIABLES.map((v) => v.token));

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** Flat map of token -> resolved string value for one product. */
export function buildProductVariableValues(product) {
  if (!product) return {};

  const currency = product.currency || 'USD';
  const slug = product.slug || '';
  const currentPrice =
    product.current_price ?? product.sale_price ?? product.price ?? '';

  return {
    'product.name': product.name || '',
    'product.short_description': product.short_description || '',
    'product.description': product.description || '',
    'product.version': product.version || '',

    'product.price': product.price ?? '',
    'product.price_formatted': formatMoney(product.price, currency),
    'product.current_price': currentPrice,
    'product.current_price_formatted': formatMoney(currentPrice, currency),
    'product.sale_price': product.sale_price ?? '',
    'product.sale_price_formatted': formatMoney(product.sale_price, currency),
    'product.currency': currency,
    'product.billing_type': product.billing_type || '',
    'product.license_type': product.license_type || '',

    'product.product_url': slug ? `/products/${slug}` : '',
    'product.landing_url': slug ? `/p/${slug}` : '',
    'product.documentation_url': product.documentation_url || '',
    'product.demo_url': product.demo_url || '',
    'product.checkout_url': slug ? `/products/${slug}?buy=1` : '',

    'product.thumbnail': product.thumbnail || '',
    'product.category_name': product.category?.name || '',
    'product.category_slug': product.category?.slug || '',

    'product.status': product.status || '',
    'product.is_featured': product.is_featured ? 'true' : 'false',
    'product.tags_joined': joinList(product.tags),
    'product.features_count': String(asList(product.features).length),
    'product.download_limit': product.download_limit ?? '',
    'product.download_expiry_days': product.download_expiry_days ?? '',
    'product.updated_at': formatDate(product.updated_at),
  };
}

/**
 * Replace {{tokens}} in a string. Unknown tokens are left verbatim so typos stay
 * visible instead of silently rendering as blank copy.
 */
export function resolveProductVariables(input, product) {
  if (typeof input !== 'string' || !input.includes('{{')) return input;
  const values = buildProductVariableValues(product);
  return input.replace(TOKEN_RE, (match, key) => {
    if (!VARIABLE_TOKENS.has(key)) return match;
    const value = values[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

/** True when a string contains at least one known or unknown token. */
export function hasProductVariable(input) {
  return typeof input === 'string' && TOKEN_PROBE_RE.test(input);
}

/** Wrap a token in the authoring syntax. */
export function productVariableToken(token) {
  return variableToken(token);
}

/**
 * Recursively resolve tokens across every string in a block, including nested
 * container children, so tokens work in any block property.
 */
export function resolveBlockVariables(value, product) {
  if (!product) return value;
  if (typeof value === 'string') return resolveProductVariables(value, product);
  if (Array.isArray(value)) return value.map((item) => resolveBlockVariables(item, product));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = resolveBlockVariables(val, product);
    }
    return out;
  }
  return value;
}

/** Variable scope for rendering product content. */
export function productVariableScope(product) {
  return createVariableScope(PRODUCT_VARIABLE_GROUPS, buildProductVariableValues(product));
}
