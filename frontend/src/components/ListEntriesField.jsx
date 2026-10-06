import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Editable list of single-line entries with add / remove / reorder.
 *
 * `value` is always a string[]. Callers adapt their storage shape, e.g. a
 * newline-delimited TextField:
 *   value={text.split('\n')}  onChange={(lines) => setText(lines.join('\n'))}
 */
export default function ListEntriesField({
  value,
  onChange,
  placeholder = 'Entry',
  addLabel = 'Add entry',
  emptyLabel = 'No entries yet.',
  max = 200,
}) {
  const [draft, setDraft] = useState('');
  const entries = Array.isArray(value) ? value : [];

  const commitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...entries, text]);
    setDraft('');
  };

  const updateAt = (index, next) =>
    onChange(entries.map((entry, i) => (i === index ? next : entry)));

  const move = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= entries.length) return;
    const next = [...entries];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const removeAt = (index) => onChange(entries.filter((_, i) => i !== index));

  return (
    <div className="list-entries">
      {entries.length === 0 && <p className="list-entries-empty">{emptyLabel}</p>}

      {entries.map((entry, i) => (
        // Key on position + value so reordering does not remount the wrong row.
        <div key={`${i}-${entry}`} className="list-entry-row">
          <span className="list-entry-index">{i + 1}</span>
          <input
            type="text"
            value={entry}
            placeholder={placeholder}
            maxLength={max}
            onChange={(e) => updateAt(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Add the next row immediately for fast bulk entry.
                onChange([...entries.slice(0, i + 1), '', ...entries.slice(i + 1)]);
              }
            }}
          />
          <div className="list-entry-actions">
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
              disabled={i === entries.length - 1}
              title="Move down"
            >
              <ChevronDown size={12} />
            </button>
            <button
              type="button"
              className="icon-button danger"
              onClick={() => removeAt(i)}
              title="Remove entry"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}

      <div className="list-entry-add">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          maxLength={max}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraft();
            }
          }}
        />
        <button
          type="button"
          className="button secondary small"
          onClick={commitDraft}
          disabled={!draft.trim()}
        >
          <Plus size={12} /> {addLabel}
        </button>
      </div>
    </div>
  );
}