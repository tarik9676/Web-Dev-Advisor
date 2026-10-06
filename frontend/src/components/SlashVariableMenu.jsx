import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { variableToken } from '../context/BlockVariableContext.jsx';
import { useVariableScope } from '../context/BlockVariableContext.jsx';

// Slash-command variable picker. Typing "/" inside any text field, textarea or
// rich-text editor within the canvas opens this list; picking an entry replaces
// the "/query" text with the token.
//
// A single instance is mounted for the whole editor and listens on the document,
// so no per-field wiring is needed and fields rendered later are covered too.

// Trigger on "/" only where it plausibly starts a command: at the start, after
// whitespace, or after punctuation that ends a clause. A slash attached to a
// word is left alone, which keeps paths ("src/app"), URLs ("https://x/") and
// mid-word text quiet. Requiring whitespace before the slash was too strict:
// in a text block the caret sits at the end of existing copy, so the menu never
// appeared at all.
const SLASH_RE = /(^|[\s.,;:!?)\]}>"'])(\/[a-zA-Z0-9_.]*)$/;

/** Nearest contentEditable host, since the event target may be a nested node. */
function resolveEditable(el) {
  if (!el || el.nodeType !== 1) return null;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el;
  if (el.isContentEditable) return el.closest('[contenteditable]') || el;
  const host = el.closest('[contenteditable]');
  return host || null;
}

function isTextEntry(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.isContentEditable) return true;
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return false;
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  return ['text', 'search', 'url', 'email', 'tel', ''].includes(type);
}

function caretInfo(el) {
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer)) return null;
    const probe = range.cloneRange();
    probe.selectNodeContents(el);
    probe.setEnd(range.startContainer, range.startOffset);
    return { offset: probe.toString().length, length: probe.toString().length };
  }
  if (typeof el.selectionStart !== 'number') return null;
  return { offset: el.selectionStart, length: el.selectionStart };
}

function textBeforeCaret(el, offset) {
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    const range = sel.getRangeAt(0);
    const probe = range.cloneRange();
    probe.selectNodeContents(el);
    probe.setEnd(range.startContainer, range.startOffset);
    return probe.toString();
  }
  return String(el.value || '').slice(0, offset);
}

/**
 * Caret viewport rect. Inputs expose no selection geometry, so mirror the
 * field's typography offscreen and measure a zero-width marker there.
 */
function caretRectFor(el, offset) {
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rects = range.getClientRects();
      const r = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
      return { left: r.left, top: r.top, bottom: r.bottom || r.top + 20 };
    }
    const elRect = el.getBoundingClientRect();
    return { left: elRect.left, top: elRect.top, bottom: elRect.top + 20 };
  }

  const style = window.getComputedStyle(el);
  const mirror = document.createElement('div');
  const copied = [
    'boxSizing', 'width', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
    'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontSize', 'lineHeight', 'fontFamily',
    'letterSpacing', 'textTransform', 'textIndent', 'textDecoration',
  ];
  copied.forEach((prop) => { mirror.style[prop] = style[prop]; });
  mirror.style.position = 'absolute';
  mirror.style.left = '0';
  mirror.style.top = '0';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.textContent = String(el.value || '').slice(0, offset);
  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const markerRect = marker.getBoundingClientRect();
  document.body.removeChild(mirror);

  const elRect = el.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 16;
  const padLeft = parseFloat(style.paddingLeft || '0');
  const borderLeft = parseFloat(style.borderLeftWidth || '0');
  return {
    left: elRect.left + markerRect.left - padLeft - borderLeft - (el.scrollLeft || 0),
    top: elRect.top + markerRect.top - (el.scrollTop || 0),
    bottom: elRect.top + markerRect.top + lineHeight - (el.scrollTop || 0),
  };
}

/** Replace [start, end) in an input/textarea, keeping React's value in sync. */
function replaceInInput(el, start, end, text) {
  const value = String(el.value || '');
  const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement : window.HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set;
  setter?.call(el, next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  const caret = start + text.length;
  requestAnimationFrame(() => {
    el.focus();
    if (typeof el.setSelectionRange === 'function') el.setSelectionRange(caret, caret);
  });
}

/** Replace the slash text at the caret in a contentEditable with text. */
function replaceInContentEditable(el, len, text) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const back = Math.min(len, range.startOffset);
  range.setStart(range.startContainer, range.startOffset - back);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
}

export default function SlashVariableMenu({ containerRef }) {
  // The catalog belongs to whichever entity the page supplies, so offer nothing
  // when no scope is provided.
  const scope = useVariableScope();
  const [state, setState] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const stateRef = useRef(null);
  const menuRef = useRef(null);
  stateRef.current = state;

  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!scope) return undefined;
    const onInput = (e) => {
      const el = resolveEditable(e.target);
      const root = containerRef?.current;
      if (!el || !isTextEntry(el)) return;
      if (root && !root.contains(el)) return;

      const caret = caretInfo(el);
      if (!caret) return;
      const before = textBeforeCaret(el, caret.offset);
      const match = SLASH_RE.exec(before);
      if (!match) {
        setState((prev) => (prev === null ? prev : null));
        return;
      }
      const slashText = match[2];
      setState({
        el,
        isCE: Boolean(el.isContentEditable),
        start: caret.offset - slashText.length,
        end: caret.offset,
        len: slashText.length,
        query: slashText.slice(1),
        rect: caretRectFor(el, caret.offset),
      });
    };

    const onPointerDown = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      close();
    };

    // Scrolling the list itself must not dismiss it. The window listener runs in
    // capture phase, so it also sees scroll events from the menu's own scrollable
    // child; ignore those and only react to the page moving out from under the menu.
    const onScroll = (e) => {
      if (menuRef.current && e.target && menuRef.current.contains(e.target)) return;
      close();
    };

    document.addEventListener('input', onInput, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [containerRef, close, scope]);

  const query = state?.query ?? '';
  const groups = !scope ? [] : scope.groups.map((g) => ({
    ...g,
    variables: g.variables.filter(
      (v) =>
        !query ||
        v.token.toLowerCase().includes(query.toLowerCase()) ||
        v.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.variables.length > 0);

  const flat = groups.flatMap((g) => g.variables);

  useEffect(() => { setActiveIndex(0); }, [query, state?.el]);

  const choose = useCallback((variable) => {
    const current = stateRef.current;
    if (!current) return;
    const text = variableToken(variable.token);
    if (current.isCE) replaceInContentEditable(current.el, current.len, text);
    else replaceInInput(current.el, current.start, current.end, text);
    setState(null);
  }, []);

  // Focus stays in the field being typed into, so navigation keys are handled
  // at the document level and prevented from reaching the field itself.
  useEffect(() => {
    if (!state) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!flat.length) return;
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((i) => {
          const n = flat.length;
          return e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
        });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (!flat.length) return;
        e.preventDefault();
        e.stopPropagation();
        choose(flat[Math.min(activeIndex, flat.length - 1)]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [state, flat, activeIndex, choose, close]);

  if (!scope || !state) return null;

  const width = 300;
  const height = 330;
  let left = state.rect.left;
  let top = state.rect.bottom;
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
  if (top + height > window.innerHeight - 8) top = Math.max(8, state.rect.top - height);

  let cursor = -1;
  return (
    <div
      ref={menuRef}
      className="variable-menu"
      style={{ position: 'fixed', left, top }}
      role="listbox"
      aria-label="Product variables"
    >
      <div className="variable-search">
        <Search size={12} />
        <span>/{query}</span>
      </div>
      <div className="variable-list">
        {flat.length === 0 && <p className="variable-empty">No matching variables</p>}
        {groups.map((g) => (
          <div key={g.group} className="variable-group">
            <span className="variable-group-label">{g.group}</span>
            {g.variables.map((v) => {
              cursor += 1;
              const index = cursor;
              return (
                <button
                  key={v.token}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`variable-item${index === activeIndex ? ' is-active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(v)}
                >
                  <code>{`{{${v.token}}}`}</code>
                  <span className="variable-label">{v.label}</span>
                  <span className="variable-example">{v.example}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}