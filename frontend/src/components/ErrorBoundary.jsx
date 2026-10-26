import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#030712',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '36px', textAlign: 'center', borderRadius: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(244,63,94,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <AlertTriangle color="#f43f5e" size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }}>
              Unexpected Application Error
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.6' }}>
              A temporary interface error occurred. The application state has been safely captured.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary"
              style={{ margin: '0 auto', background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}
            >
              <RefreshCw size={18} /> Reload System Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
