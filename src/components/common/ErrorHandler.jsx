import { Component } from 'react';

/* ─────────────────────────────────────────────────────
   mapApiError
   Converts any Axios error into a human-readable message.
   Used by React Query's onError + anywhere you catch.
───────────────────────────────────────────────────── */
export function mapApiError(error) {
  /* No response at all — network down or timeout */
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        title: 'Request timed out',
        message: 'The server took too long to respond. Please try again.',
      };
    }
    return {
      title: 'Cannot reach server',
      message: 'Please check your network connection and try again.',
    };
  }

  const status = error.response.status;
  const data   = error.response.data;

  /* Spring Boot validation errors — @Valid returns field messages */
  if (status === 400) {
    if (data?.errors && Array.isArray(data.errors)) {
      const msgs = data.errors.map(e => e.defaultMessage || e.message).join(', ');
      return { title: 'Validation Error', message: msgs };
    }
    return {
      title: 'Invalid Request',
      message: data?.message || 'Please check the entered details and try again.',
    };
  }

  if (status === 401) return {
    title: 'Session Expired',
    message: 'Please sign in again to continue.',
  };

  if (status === 403) return {
    title: 'Access Denied',
    message: "You don't have permission to perform this action.",
  };

  if (status === 404) return {
    title: 'Not Found',
    message: data?.message || 'This record no longer exists. It may have been deleted.',
  };

  if (status === 409) return {
    title: 'Conflict',
    message: data?.message || 'This action conflicts with existing data.',
  };

  if (status === 422) return {
    title: 'Unprocessable',
    message: data?.message || 'The server could not process this request.',
  };

  if (status >= 500) return {
    title: 'Server Error',
    message: 'Something went wrong on the server. Please try again in a moment.',
  };

  return {
    title: `Error ${status}`,
    message: data?.message || 'An unexpected error occurred.',
  };
}

/* ─────────────────────────────────────────────────────
   ErrorBoundary
   Catches JS runtime errors and shows a safe fallback.
   Wrap around <App /> or individual screens.
───────────────────────────────────────────────────── */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: 'var(--bg)', color: 'var(--text)', gap: '12px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: '32px' }}>⚠️</div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700, fontSize: '20px', color: 'var(--accent4)',
        }}>
          Something went wrong
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '360px', textAlign: 'center' }}>
          An unexpected error occurred. Please refresh the page. If the problem persists, contact support.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px', padding: '9px 20px', borderRadius: '8px',
            border: 'none', background: 'var(--accent)', color: '#000',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: 500,
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
}
