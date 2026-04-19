import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents.js';
import { EventCard } from '../components/common/EventCard.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

const CATEGORIES = ['all', 'Technology', 'Music', 'Business', 'Design', 'Health', 'Arts'];

export default function AllEvents() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const { events, loading, setFilters } = useEvents({ category, search });

  const applyCategory = (cat) => {
    setCategory(cat);
    setFilters(f => ({ ...f, category: cat }));
  };

  const applySearch = (e) => {
    setSearch(e.target.value);
    setFilters(f => ({ ...f, search: e.target.value }));
  };

  return (
    <div className="page">
      {/* Page header */}
      <div className="dashboard-header">
        <div className="container">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Browse Events</h1>
          <p className="text-muted">Find and book your next experience</p>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        {/* Search + filters */}
        <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ maxWidth: 320 }}
            placeholder="Search events…"
            value={search}
            onChange={applySearch}
          />
        </div>
        <div className="filter-bar mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`filter-chip${category === cat ? ' filter-chip--active' : ''}`} onClick={() => applyCategory(cat)}>
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {loading ? <SpinnerPage /> : events.length === 0 ? (
          <div className="empty-state">
            <h3>No Events Found</h3>
            <p>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            <p className="text-muted mb-4">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
            <div className="grid-3">
              {events.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
