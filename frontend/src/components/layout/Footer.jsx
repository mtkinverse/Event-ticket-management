import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">Event<span>Hub</span></div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>Discover and attend the events that matter to you. Create, manage, and grow your events with confidence.</p>
          </div>
          <div>
            <div className="footer__heading">Explore</div>
            <Link to="/events" className="footer__link">Browse Events</Link>
            <Link to="/events/new" className="footer__link">Create Event</Link>
            <Link to="/login" className="footer__link">Sign In</Link>
          </div>
          <div>
            <div className="footer__heading">Support</div>
            <span className="footer__link">Help Centre</span>
            <span className="footer__link">Contact Us</span>
            <span className="footer__link">Privacy Policy</span>
          </div>
        </div>
        <div className="footer__bottom">
          © {new Date().getFullYear()} EventHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
