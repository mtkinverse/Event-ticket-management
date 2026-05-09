import { Badge } from './Badge.jsx';

export function QrTicket({ ticket }) {
  return (
    <div className="qr-ticket">
      <img src={ticket.qrCode} alt={`Ticket ${ticket.id}`} className="qr-ticket__img" />
      <div className="qr-ticket__meta">
        <code className="qr-ticket__id">#{ticket.id.slice(0, 8)}</code>
        <Badge label={ticket.status} />
      </div>
    </div>
  );
}
