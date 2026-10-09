import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, Link, X } from 'lucide-react';

export default function RichTextField({
  value = '',
  onChange,
  placeholder = 'Write something...',
  toolbar = true,
}) {
  const ref = useRef(null);
  const dirty = useRef(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (ref.current && !dirty.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const runCommand = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange?.(ref.current?.innerHTML || '');
  };

  const handleLinkClick = () => {
    setIsLinkModalOpen(true);
    setLinkUrl('');
  };

  const handleLinkConfirm = () => {
    if (linkUrl.trim()) {
      runCommand('createLink', linkUrl.trim());
    }
    setIsLinkModalOpen(false);
  };

  const handleLinkCancel = () => {
    setIsLinkModalOpen(false);
  };

  return (
    <div className="richtext-field">
      {toolbar && (
        <div className="richtext-toolbar" role="toolbar" aria-label="Text formatting">
          <button
            type="button"
            className="icon-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand('bold')}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            className="icon-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand('italic')}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            className="icon-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand('underline')}
            title="Underline (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline size={13} />
          </button>
          <button
            type="button"
            className="icon-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand('insertUnorderedList')}
            title="Bullet list"
            aria-label="Bullet list"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Insert link"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLinkClick}
            aria-label="Insert link"
          >
            <Link size={13} />
          </button>
        </div>
      )}
      <div
        ref={ref}
        className="richtext-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => {
          dirty.current = true;
          onChange?.(e.currentTarget.innerHTML);
        }}
        onBlur={() => {
          dirty.current = false;
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            runCommand('bold');
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            runCommand('italic');
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            runCommand('underline');
          }
        }}
      />
      {isLinkModalOpen && (
        <div className="modal-backdrop" onClick={handleLinkCancel}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Insert Link</strong>
              <button className="icon-button" onClick={handleLinkCancel} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleLinkConfirm()}
              />
              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button className="button secondary" onClick={handleLinkCancel} type="button">
                  Cancel
                </button>
                <button className="button primary" onClick={handleLinkConfirm} type="button">
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}