import { Spinner } from './Spinner.jsx';

export function Button({ children, variant = 'primary', size = '', loading = false, className = '', ...props }) {
  return (
    <button className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
