import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, X, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';

export default function ClientSelect({
  value,
  onChange,
  placeholder = 'Search or create client...',
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createCompany, setCreateCompany] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const debouncedSearch = useRef(null);

  const fetchClients = useCallback(async (search) => {
    setLoading(true);
    setError(null);
    try {
      const params = search ? { search } : {};
      const data = await api.get('/clients/', { params });
      setClients(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerSearch = useCallback((searchQuery) => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      fetchClients(searchQuery);
    }, 250);
  }, [fetchClients]);

  useEffect(() => {
    if (value) {
      setSelectedClient(null);
      api.get(`/clients/${value}/`).then(data => setSelectedClient(data)).catch(() => setSelectedClient(null));
    } else {
      setSelectedClient(null);
    }
  }, [value]);

  // Position dropdown
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCreate(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
      setShowCreate(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleSelect = (client) => {
    setSelectedClient(client);
    setQuery(client.name);
    onChange(client.id);
    setIsOpen(false);
    setShowCreate(false);
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.length >= 3) {
      triggerSearch(newQuery);
    } else {
      setClients([]);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setError(null);
    try {
      const created = await api.post('/clients/', {
        name: createName.trim(),
        email: createEmail.trim(),
        company: createCompany.trim(),
      });
      handleSelect(created);
      setCreateName('');
      setCreateEmail('');
      setCreateCompany('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedClient(null);
    setQuery('');
    onChange('');
  };

  const displayValue = selectedClient?.name || query;

  return (
    <div className="client-select" ref={dropdownRef}>
      <div className="client-select-trigger" onClick={() => !disabled && setIsOpen(true)}>
        <Search className="client-select-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={selectedClient ? undefined : handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'ArrowDown' && !selectedClient) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!!selectedClient}
          aria-autocomplete={selectedClient ? 'none' : 'list'}
          aria-expanded={isOpen}
          aria-controls="client-select-options"
          role={selectedClient ? 'textbox' : 'combobox'}
        />
        {selectedClient && !disabled && (
          <button
            type="button"
            className="icon-button client-select-clear"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} className={`client-select-chevron${isOpen ? ' open' : ''}`} aria-hidden="true" />
      </div>

      {isOpen && (
        <div
          className="client-select-dropdown"
          id="client-select-options"
          role="listbox"
          style={dropdownStyle}
        >
          {showCreate ? (
            <form onSubmit={handleCreate} className="client-create-form">
              <div className="client-create-header">
                <span>Create New Client</span>
                <button type="button" className="icon-button" onClick={() => setShowCreate(false)} aria-label="Back to search">
                  <X size={14} />
                </button>
              </div>
              <div className="form-grid" style={{ gap: '10px' }}>
                <label>
                  <span>Name <em className="meta-required">*</em></span>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Acme Inc."
                    autoFocus
                    required
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="contact@acme.com"
                  />
                </label>
                <label className="span-2">
                  <span>Company</span>
                  <input
                    type="text"
                    value={createCompany}
                    onChange={(e) => setCreateCompany(e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </label>
              </div>
              {error && <div className="toast toast-error" style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>}
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setShowCreate(false)} disabled={createLoading}>
                  Cancel
                </button>
                <button type="submit" className="button primary" disabled={createLoading || !createName.trim()}>
                  {createLoading ? <Loader2 size={14} className="spin" /> : <><Plus size={14} /> Create Client</>}
                </button>
              </div>
            </form>
          ) : (
            <>
              {loading ? (
                <div className="client-select-loading">
                  <Loader2 size={18} className="spin" />
                  <span>Searching...</span>
                </div>
              ) : query.length >= 3 ? (
                clients.length > 0 ? (
                  clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className={`client-select-option${selectedClient?.id === client.id ? ' selected' : ''}`}
                      role="option"
                      aria-selected={selectedClient?.id === client.id}
                      onClick={() => handleSelect(client)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="client-option-main">
                        <strong>{client.name}</strong>
                        {client.company && <span className="client-option-company">{client.company}</span>}
                      </div>
                      {client.email && <span className="client-option-email">{client.email}</span>}
                    </button>
                  ))
                ) : (
                  <div className="client-select-empty">
                    <p>No clients found matching "{query}".</p>
                    <button type="button" className="button secondary small" onClick={() => setShowCreate(true)}>
                      <Plus size={12} /> Create New Client
                    </button>
                  </div>
                )
              ) : (
                <div className="client-select-empty">
                  <button type="button" className="button secondary small" onClick={() => setShowCreate(true)}>
                    <Plus size={12} /> Create New Client
                  </button>
                </div>
              )}
              {!loading && query.length >= 3 && clients.length > 0 && (
                <button type="button" className="client-select-create-btn" onClick={() => setShowCreate(true)}>
                  <Plus size={14} /> Create New Client
                </button>
              )}
            </>
          )}
        </div>
      )}
      {required && !selectedClient && !value && <input type="hidden" name="client_id" value="" />}
    </div>
  );
}