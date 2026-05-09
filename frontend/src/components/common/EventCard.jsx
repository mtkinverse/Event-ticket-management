import { Link } from 'react-router-dom';
import { Badge } from './Badge.jsx';

export function EventCard({ event }) {
  const { id, title, category, location, date, priceFormatted, imageUrl, isSoldOut, isAlmostFull, status } = event;

  return (
    <div className="event-card">
      <div className="event-card__image">
        <img src={imageUrl || 'https://picsum.photos/seed/default/640/360'} alt={title} loading="lazy" />
        <div className="event-card__date-badge">
          <div className="day">{date.day}</div>
          <div className="month">{date.month}</div>
        </div>
        {status !== 'active' && <div style={{ position:'absolute', top: 8, right: 8 }}><Badge label={status} /></div>}
      </div>
      <div className="event-card__body">
        <div className="event-card__category">{category}</div>
        <h3 className="event-card__title">{title}</h3>
        <div className="event-card__meta">
          <span className="event-card__meta-item">📍 {location}</span>
          <span className="event-card__meta-item">📅 {date.full}</span>
        </div>
        <div className="event-card__footer">
          <span className="event-card__price">{priceFormatted}</span>
          {isSoldOut
            ? <Link to={`/events/${id}`} className="btn btn--outline btn--sm">Join Waitlist</Link>
            : isAlmostFull
              ? <Link to={`/events/${id}`} className="btn btn--primary btn--sm">Almost Full!</Link>
              : <Link to={`/events/${id}`} className="btn btn--primary btn--sm">Book Now</Link>
          }
        </div>
      </div>
    </div>
  );
}
