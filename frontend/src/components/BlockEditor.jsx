import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, X, Settings2, MousePointerClick, Link as LinkIcon,
  PanelRightClose, PanelRightOpen,
  Image as ImageIcon, Type, Heading1, Square, List, DollarSign, Images,
  Code, Minus, Layout, Quote, Code2, Columns, Rows, Box,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';
import BlockRenderer from './BlockRenderer';
import SlashVariableMenu from './SlashVariableMenu';
import { resolveWrapperMargin } from '../lib/blockSpacing.js';
import { BLOCK_TYPES, BLOCK_CATEGORIES, createBlock } from './BlockRegistry';

const ICONS = { Type, Heading1, Image: ImageIcon, Square, List, DollarSign, Images, Code, Minus, Layout, Quote, Code2, Columns, Rows, Box };

// Icons referenced by name from the property schema's segmented options.
const SEGMENT_ICONS = { AlignLeft, AlignCenter, AlignRight, Rows, Columns };

function SegmentIcon({ name }) {
  const Comp = SEGMENT_ICONS[name];
  if (!Comp) return null;
  return <Comp size={13} aria-hidden="true" />;
}

/* --- Tree helpers -------------------------------------------------------- */

function updateBlockRecursive(blocks, blockId, updater) {
  return blocks.map((block) => {
    if (block.id === blockId) return updater(block);
    if (block.blocks && block.blocks.length > 0) {
      return { ...block, blocks: updateBlockRecursive(block.blocks, blockId, updater) };
    }
    return block;
  });
}

function deleteBlockRecursive(blocks, blockId) {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => (block.blocks && block.blocks.length > 0
      ? { ...block, blocks: deleteBlockRecursive(block.blocks, blockId) }
      : block));
}

function findBlockRecursive(blocks, blockId) {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    if (block.blocks && block.blocks.length > 0) {
      const found = findBlockRecursive(block.blocks, blockId);
      if (found) return found;
    }
  }
  return null;
}

function countBlocks(blocks) {
  return blocks.reduce((total, block) => total + 1 + countBlocks(block.blocks || []), 0);
}

/* --- Settings panel fields ----------------------------------------------- */

function RichTextField({ value, onChange }) {
  const ref = useRef(null);
  const dirty = useRef(false);

  useEffect(() => {
    // Only seed the DOM from props while the user is not typing, otherwise React
    // re-applies innerHTML on every keystroke and the caret jumps to the start.
    if (ref.current && !dirty.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const runCommand = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <>
      <div className="richtext-toolbar">
        <button type="button" className="icon-button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('bold')} title="Bold">
          <b>B</b>
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('italic')} title="Italic">
          <i>I</i>
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" className="icon-button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('insertUnorderedList')} title="Bullet list">
          <List size={12} />
        </button>
        <button
          type="button"
          className="icon-button"
          title="Insert link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) runCommand('createLink', url);
          }}
        >
          <LinkIcon size={12} />
        </button>
      </div>
      <div
        ref={ref}
        className="richtext-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write something..."
        onInput={(e) => { dirty.current = true; onChange(e.currentTarget.innerHTML); }}
        onBlur={() => { dirty.current = false; }}
      />
    </>
  );
}

function StringListField({ label, items, onChange }) {
  const arr = Array.isArray(items) ? items : [];
  return (
    <div className="property-field array">
      <span>{label}</span>
      <div className="array-items">
        {arr.map((item, i) => (
          <div key={i} className="array-item">
            <input
              type="text"
              value={item ?? ''}
              onChange={(e) => {
                const next = [...arr];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button type="button" className="icon-button danger" title="Remove" onClick={() => onChange(arr.filter((_, idx) => idx !== i))}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" className="button secondary small" onClick={() => onChange([...arr, ''])}>
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}

function ObjectListField({ label, items, itemDefault, onChange }) {
  const arr = Array.isArray(items) ? items : [];
  const objectKeys = Object.keys(itemDefault);

  const updateItem = (index, patch) =>
    onChange(arr.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="property-field array">
      <span>{label}</span>
      <div className="array-items">
        {arr.map((item, i) => (
          <div key={i} className="array-item object">
            <div className="object-fields">
              {objectKeys.map((objKey) => {
                const isBool = typeof itemDefault[objKey] === 'boolean';
                const isList = Array.isArray(itemDefault[objKey]);
                const raw = item?.[objKey];
                return (
                  <label key={objKey} className={isBool ? 'property-field checkbox' : 'property-field'}>
                    <span>{objKey}</span>
                    {isBool ? (
                      <input type="checkbox" checked={Boolean(raw)} onChange={(e) => updateItem(i, { [objKey]: e.target.checked })} />
                    ) : isList ? (
                      <textarea
                        rows={2}
                        value={Array.isArray(raw) ? raw.join('\n') : ''}
                        onChange={(e) => updateItem(i, {
                          [objKey]: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                        })}
                      />
                    ) : (
                      <input type="text" value={raw ?? ''} onChange={(e) => updateItem(i, { [objKey]: e.target.value })} />
                    )}
                  </label>
                );
              })}
            </div>
            <button type="button" className="icon-button danger" title="Remove" onClick={() => onChange(arr.filter((_, idx) => idx !== i))}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button secondary small"
          onClick={() => onChange([...arr, JSON.parse(JSON.stringify(itemDefault))])}
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}

function PropertyField({ fieldKey, fieldDef, value, onChange }) {
  const label = fieldDef.label || fieldKey;

  switch (fieldDef.type) {
    case 'segmented':
      return (
        <div className="property-field">
          <span>{label}</span>
          <div className="segmented-group" role="group" aria-label={label}>
            {fieldDef.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`segmented-btn${value === opt.value ? ' active' : ''}`}
                aria-pressed={value === opt.value}
                title={opt.label || opt.value}
                onClick={() => onChange(opt.value)}
              >
                {opt.icon ? <SegmentIcon name={opt.icon} /> : null}
                <span>{opt.label || opt.value}</span>
              </button>
            ))}
          </div>
        </div>
      );
    case 'select':
      return (
        <label className="property-field">
          <span>{label}</span>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {fieldDef.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      );
    case 'textarea':
      return (
        <label className="property-field">
          <span>{label}</span>
          <textarea rows={fieldDef.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'checkbox':
      return (
        <label className="property-field checkbox">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{label}</span>
        </label>
      );
    case 'number':
      return (
        <label className="property-field">
          <span>{label}</span>
          <input
            type="number"
            value={value ?? ''}
            min={fieldDef.min}
            max={fieldDef.max}
            step={fieldDef.step}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>
      );
    case 'richtext':
      return (
        <div className="property-field">
          <span>{label}</span>
          <RichTextField value={value} onChange={onChange} />
        </div>
      );
    case 'array':
      if (fieldDef.itemDefault && typeof fieldDef.itemDefault === 'object') {
        return (
          <ObjectListField
            label={label}
            items={value}
            itemDefault={fieldDef.itemDefault}
            onChange={onChange}
          />
        );
      }
      return <StringListField label={label} items={value} onChange={onChange} />;
    default:
      return (
        <label className="property-field">
          <span>{label}</span>
          <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
  }
}

/* --- Nested blocks editor (containers) ----------------------------------- */

function NestedBlocksField({ blocks, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const children = Array.isArray(blocks) ? blocks : [];

  const move = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= children.length) return;
    const next = [...children];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="property-field array nested-blocks-field">
      <span>Blocks ({children.length})</span>
      <div className="nested-blocks">
        {children.map((child, i) => {
          const childDef = BLOCK_TYPES[child.type];
          const IconComp = ICONS[childDef?.icon || 'Square'] || Square;
          return (
            <div key={child.id || i} className="nested-block-row">
              <IconComp size={12} />
              <span className="nested-block-label">{childDef?.label || child.type}</span>
              <div className="nested-block-actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => move(i, 1)}
                  disabled={i === children.length - 1}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => onChange(children.filter((_, idx) => idx !== i))}
                  title="Remove block"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {children.length === 0 && (
          <p className="nested-blocks-empty">No blocks in this container yet.</p>
        )}
      </div>
      <button type="button" className="button secondary small" onClick={() => setPickerOpen(true)}>
        <Plus size={12} /> Add block to container
      </button>
      <BlockPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(type) => {
          onChange([...children, createBlock(type)]);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

/* --- Left settings panel ------------------------------------------------- */

function BlockPropertyPanel({ block, onChange, onClose }) {
  if (!block) {
    return (
      <aside className="block-settings-panel is-empty" aria-label="Block settings">
        <div className="sidebar-header">
          <h3>Block Settings</h3>
        </div>
        <div className="settings-empty">
          <MousePointerClick size={30} />
          <h4>No block selected</h4>
          <p>Click any block on the canvas to edit its content and settings here.</p>
        </div>
      </aside>
    );
  }

  const def = BLOCK_TYPES[block.type];
  const fields = def?.propertySchema || Object.fromEntries(
    Object.keys(def?.defaults || {}).map((key) => [key, { type: 'text' }]),
  );

  return (
    <aside className="block-settings-panel" aria-label="Block settings">
      <div className="sidebar-header">
        <h3>Block Settings</h3>
        <button className="icon-button" onClick={onClose} type="button" aria-label="Close settings" title="Close">
          <X size={15} />
        </button>
      </div>
      <div className="settings-block-type">
        {(() => {
          const IconComp = ICONS[def?.icon || 'Square'] || Square;
          return <IconComp size={13} />;
        })()}
        <span>{def?.label || block.type}</span>
      </div>
      <div className="property-editor-body">
        {def?.isContainer && (
          <NestedBlocksField
            blocks={block.blocks}
            onChange={(children) => onChange({ ...block, blocks: children })}
          />
        )}
        {Object.entries(fields).map(([key, fieldDef]) => (
          <PropertyField
            key={key}
            fieldKey={key}
            fieldDef={fieldDef}
            value={block[key]}
            onChange={(value) => onChange({ ...block, [key]: value })}
          />
        ))}
      </div>
    </aside>
  );
}

/* --- Block picker modal -------------------------------------------------- */

function BlockPickerModal({ open, onClose, onPick }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="block-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="block-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Add block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="block-picker-header">
          <h3>Add block</h3>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="block-picker-body">
          {Object.entries(BLOCK_CATEGORIES).map(([category, { label, types }]) => (
            <section key={category} className="block-picker-section">
              <h4>{label}</h4>
              <div className="block-picker-grid">
                {types.map((type) => {
                  const blockDef = BLOCK_TYPES[type];
                  const IconComp = ICONS[blockDef.icon] || Square;
                  return (
                    <button key={type} type="button" className="block-picker-item" onClick={() => onPick(type)}>
                      <IconComp size={16} />
                      <span>{blockDef.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Canvas -------------------------------------------------------------- */

function BlockCanvasItem({ block, index, total, selectedId, onSelect, onMove, onDelete, depth = 0 }) {
  const isSelected = selectedId === block.id;
  const draggingRef = useRef(false);

  const handleDragStart = useCallback((e) => {
    draggingRef.current = true;
    e.dataTransfer.setData('application/x-block-id', block.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  }, [block.id]);

  const handleDragEnd = useCallback((e) => {
    draggingRef.current = false;
    e.currentTarget.classList.remove('dragging');
  }, []);

  const handleDragOver = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const droppedId = e.dataTransfer.getData('application/x-block-id');
    if (droppedId && droppedId !== block.id) {
      onMove(droppedId, index);
    }
  }, [block.id, index, onMove]);

  const handleClick = useCallback((e) => {
    if (draggingRef.current) return;
    e.stopPropagation();
    onSelect(isSelected ? null : block.id);
  }, [block.id, isSelected, onSelect]);

  const children = Array.isArray(block.blocks) ? block.blocks : [];
  const showChildren = children.length > 0 && depth < 2;

  // Nested blocks are rendered by the container itself so the container's
  // layout (width/direction/padding/background) actually wraps them. The list
  // must mirror the container's direction, otherwise children stack vertically
  // even when the container is set to Horizontal.
  const isRow = block.direction === 'row';
  const renderNested = () => (
    <div className={`block-nested-list${isRow ? ' is-row' : ''}`}>
      {children.map((child, i) => (
        <BlockCanvasItem
          key={`${child.id}-${i}`}
          block={child}
          index={i}
          total={children.length}
          selectedId={selectedId}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );

  return (
    <div
      className={`block-canvas-item${isSelected ? ' selected' : ''}${depth > 0 ? ' is-nested' : ''}`}
      style={{ margin: resolveWrapperMargin(block) }}
      draggable={depth === 0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(isSelected ? null : block.id);
        }
      }}
      aria-pressed={isSelected}
    >
      <BlockRenderer block={block} renderChildren={showChildren ? renderNested : undefined} />
    </div>
  );
}

function InsertDivider({ onInsert }) {
  return (
    <div className="block-insert-divider">
      <span className="block-insert-line" />
      <button type="button" className="block-insert-btn" onClick={onInsert} title="Add block here">
        <Plus size={14} />
      </button>
      <span className="block-insert-line" />
    </div>
  );
}

function flattenBlocks(blocks, depth = 0, out = []) {
  blocks.forEach((block, index) => {
    out.push({ block, depth, index, total: blocks.length });
    if (block.blocks?.length) flattenBlocks(block.blocks, depth + 1, out);
  });
  return out;
}

function BlockNavigator({ blocks, selectedId, onSelect, onMove, onDelete }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('app:block-nav-collapsed') === '1';
  });

  useEffect(() => {
    window.localStorage.setItem('app:block-nav-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const entries = flattenBlocks(blocks);

  return (
    <aside className={`block-navigator${collapsed ? ' is-collapsed' : ''}`} aria-label="Block navigator">
      <div className="sidebar-header">
        {!collapsed && <h3>Blocks</h3>}
        <button
          className="icon-button"
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Show block navigator' : 'Hide block navigator'}
        >
          {collapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="navigator-count">{entries.length} block{entries.length === 1 ? '' : 's'}</div>
          {entries.length === 0 ? (
            <p className="navigator-empty">No blocks yet. Use + on the canvas to add one.</p>
          ) : (
            <ul className="navigator-list">
              {entries.map(({ block, depth, index, total }) => {
                const def = BLOCK_TYPES[block.type];
                const IconComp = ICONS[def?.icon || 'Square'] || Square;
                const isSelected = selectedId === block.id;
                return (
                  <li key={block.id || `${block.type}-${index}`}>
                    <div
                      className={`navigator-row${isSelected ? ' is-selected' : ''}`}
                      style={{ paddingLeft: 10 + depth * 13 }}
                    >
                      <button
                        type="button"
                        className="navigator-label"
                        onClick={() => onSelect(isSelected ? null : block.id)}
                        title={def?.label || block.type}
                        aria-pressed={isSelected}
                      >
                        <IconComp size={12} />
                        <span>{def?.label || block.type}</span>
                      </button>
                      <div className="navigator-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => onMove(block.id, index - 1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => onMove(block.id, index + 1)}
                          disabled={index === total - 1}
                          title="Move down"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => onDelete(block.id)}
                          title="Remove block"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}

function BlockCanvas({
  blocks, onUpdateBlock, onDeleteBlock, onMoveBlock, onInsertBlock,
  selectedId, onSelectBlock, emptyMessage,
}) {
  const [pickerAt, setPickerAt] = useState(null);

  const handlePick = useCallback((type) => {
    const newBlock = createBlock(type);
    onInsertBlock(newBlock, pickerAt === null ? blocks.length : pickerAt);
    setPickerAt(null);
  }, [onInsertBlock, pickerAt, blocks.length]);

  if (blocks.length === 0) {
    return (
      <div className="block-canvas empty">
        <div className="empty-state">
          <Square size={44} />
          <h4>Empty Canvas</h4>
          <p>{emptyMessage || 'Add blocks to start building your page'}</p>
          <button className="button primary" type="button" onClick={() => setPickerAt(0)}>
            <Plus size={14} /> Add block
          </button>
        </div>
        <BlockPickerModal open={pickerAt !== null} onClose={() => setPickerAt(null)} onPick={handlePick} />
      </div>
    );
  }

  return (
    <div className="block-canvas" onClick={() => onSelectBlock(null)}>
      {blocks.map((block, index) => (
        <div key={block.id}>
          <InsertDivider onInsert={() => setPickerAt(index)} />
          <BlockCanvasItem
            block={block}
            index={index}
            total={blocks.length}
            selectedId={selectedId}
            onSelect={onSelectBlock}
            onMove={onMoveBlock}
            onDelete={onDeleteBlock}
          />
        </div>
      ))}
      <InsertDivider onInsert={() => setPickerAt(blocks.length)} />
      <BlockPickerModal open={pickerAt !== null} onClose={() => setPickerAt(null)} onPick={handlePick} />
    </div>
  );
}

/* --- Editor -------------------------------------------------------------- */

export default function BlockEditor({ blocks: initialBlocks = [], onChange, readOnly = false, emptyMessage }) {
  const rootRef = useRef(null);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedId, setSelectedId] = useState(null);
  const lastEmitted = useRef(initialBlocks);

  // Adopt externally supplied blocks (initial load), but ignore the echo of our
  // own emit so we do not feed a state loop back into the parent.
  useEffect(() => {
    if (initialBlocks === lastEmitted.current) return;
    lastEmitted.current = initialBlocks;
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  useEffect(() => {
    lastEmitted.current = blocks;
    if (onChange) onChange(blocks);
  }, [blocks, onChange]);

  const selectedBlock = useCallback(
    () => (selectedId ? findBlockRecursive(blocks, selectedId) : null),
    [blocks, selectedId],
  );

  const handleUpdateBlock = useCallback((updated) => {
    const filtered = Object.fromEntries(Object.entries(updated).filter(([k]) => !k.startsWith('__')));
    setBlocks(prev => updateBlockRecursive(prev, filtered.id, () => filtered));
  }, []);

  const handleDeleteBlock = useCallback((id) => {
    setBlocks(prev => deleteBlockRecursive(prev, id));
    setSelectedId(prev => (prev === id ? null : prev));
  }, []);

  // Moves a block to an absolute sibling index within whichever array holds it.
  const handleMoveBlock = useCallback((blockId, toIndex) => {
    // Mirrors flattenBlocks: search every level so nested blocks listed in the
    // navigator can actually be reordered.
    const moveWithin = (list) => {
      const from = list.findIndex((b) => b.id === blockId);
      if (from !== -1) {
        if (toIndex < 0 || toIndex >= list.length) return list;
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(toIndex, 0, moved);
        return next;
      }
      let changed = false;
      const next = list.map((block) => {
        if (!block.blocks?.length) return block;
        const nested = moveWithin(block.blocks);
        if (!nested || nested === block.blocks) return block;
        changed = true;
        return { ...block, blocks: nested };
      });
      return changed ? next : null;
    };
    setBlocks(prev => moveWithin(prev) || prev);
  }, []);

  const handleInsertBlock = useCallback((newBlock, index) => {
    setBlocks(prev => {
      const next = [...prev];
      next.splice(index, 0, newBlock);
      return next;
    });
    setSelectedId(newBlock.id);
  }, []);

  if (readOnly) {
    return (
      <div className="block-editor read-only">
        <div className="block-canvas">
          {blocks.map(block => (
            <div key={block.id} className="block-canvas-item">
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeBlock = selectedBlock();

  return (
    <div className="block-editor" ref={rootRef}>
      <SlashVariableMenu containerRef={rootRef} />
      <div className="block-editor-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">Page Content</span>
          <span className="block-count">{countBlocks(blocks)} block{countBlocks(blocks) === 1 ? '' : 's'}</span>
        </div>
        <div className="toolbar-right">
          <span className="canvas-hint">
            <Settings2 size={13} /> Select a block to edit it in the settings panel
          </span>
        </div>
      </div>
      <div className="block-editor-main">
        <BlockPropertyPanel
          block={activeBlock}
          onChange={handleUpdateBlock}
          onClose={() => setSelectedId(null)}
        />
        <div className="block-editor-canvas-wrapper">
          <BlockCanvas
            blocks={blocks}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            onInsertBlock={handleInsertBlock}
            selectedId={selectedId}
            onSelectBlock={setSelectedId}
            emptyMessage={emptyMessage}
          />
        </div>
        <BlockNavigator
          blocks={blocks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={handleMoveBlock}
          onDelete={handleDeleteBlock}
        />
      </div>
    </div>
  );
}
/** Total block count including nested children. */
export { countBlocks };
