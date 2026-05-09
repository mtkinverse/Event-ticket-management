import { Badge } from './Badge.jsx';

export function QrTicket({ ticket }) {
  return (
    <div className="qr-ticket">
      <img src={ticket.qrCode} alt={`Ticket ${ticket.ticketNumber}`} className="qr-ticket__img" />
      <div className="qr-ticket__meta">
        <code className="qr-ticket__id">{ticket.ticketNumber}</code>
        <Badge label={ticket.scannedAt ? 'scanned' : 'valid'} />
      </div>
    </div>
  );
}
