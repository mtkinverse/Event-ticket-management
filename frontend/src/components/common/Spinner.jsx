export function Spinner({ size = '' }) {
  return <div className={`spinner ${size ? `spinner--${size}` : ''}`} aria-label="Loading" />;
}

export function SpinnerPage() {
  return <div className="spinner-wrap"><Spinner size="lg" /></div>;
}
