import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';

export default function UserSearch({ placeholder = 'Search users…', onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debouncedSearch = useRef(null);

  const fetchUsers = useCallback(async (search) => {
    setLoading(true);
    try {
      const data = await api.get('/users/search/', { params: { q: search } });
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerSearch = useCallback((searchQuery) => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchUsers(searchQuery);
      } else {
        setUsers([]);
      }
    }, 250);
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.length >= 2) {
      triggerSearch(newQuery);
    } else {
      setUsers([]);
    }
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (user) => {
    setQuery('');
    setIsOpen(false);
    setUsers([]);
    if (onSelect) onSelect(user);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setUsers([]);
    setIsOpen(false);
  };

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
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <div className="client-select" ref={dropdownRef}>
      <div className="client-select-trigger">
        <Search className="client-select-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'ArrowDown' && !isOpen) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="user-search-options"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            className="icon-button client-select-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} className={`client-select-chevron${isOpen ? ' open' : ''}`} aria-hidden="true" />
      </div>

      {isOpen && (
        <div
          className="client-select-dropdown"
          id="user-search-options"
          role="listbox"
          style={dropdownStyle}
        >
          {loading ? (
            <div className="client-select-loading">
              <Loader2 size={18} className="spin" />
              <span>Searching…</span>
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="client-select-option"
                role="option"
                onClick={() => handleSelect(user)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="client-option-main">
                  <strong>{user.username}</strong>
                  {user.full_name && <span className="client-option-company">{user.full_name}</span>}
                </div>
                {user.email && <span className="client-option-email">{user.email}</span>}
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="client-select-empty">
              <p>No users found matching "{query}".</p>
            </div>
          ) : (
            <div className="client-select-empty">
              <p>Type at least 2 characters to search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
