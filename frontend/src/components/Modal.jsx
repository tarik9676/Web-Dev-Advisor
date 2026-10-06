import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" style={{ width }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <strong>{title}</strong>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
