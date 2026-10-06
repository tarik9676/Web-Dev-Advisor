import { createContext, useContext } from 'react';

// A "variable scope" lets any block contain {{entity.field}} tokens. The scope
// is supplied by the page that owns the content: products provide a product
// scope, services a service scope. Without a scope, tokens are left untouched so
// authored copy is never silently blanked.

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Wrap a token in its authoring syntax. */
export function variableToken(token) {
  return `{{${token}}}`;
}

/**
 * Build a scope from a catalog and a flat token -> value map.
 * Unknown tokens are left verbatim so typos stay visible in the output.
 */
export function createVariableScope(groups, values) {
  const known = new Set(groups.flatMap((g) => g.variables.map((v) => v.token)));

  const resolve = (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      if (!value.includes('{{')) return value;
      return value.replace(TOKEN_RE, (match, key) => {
        if (!known.has(key)) return match;
        const resolved = values[key];
        return resolved === null || resolved === undefined ? '' : String(resolved);
      });
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (typeof value === 'object') {
      const out = {};
      for (const [key, val] of Object.entries(value)) out[key] = resolve(val);
      return out;
    }
    return value;
  };

  return { groups, resolve };
}

export const BlockVariableContext = createContext(null);

export function useVariableScope() {
  return useContext(BlockVariableContext);
}