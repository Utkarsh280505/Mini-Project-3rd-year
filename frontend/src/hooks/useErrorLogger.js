import { useEffect } from 'react';

export function useErrorLogger() {
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('[NeuroEarly Telemetry Error Log]:', event.error || event.message);
    };

    const handleUnhandledRejection = (event) => {
      console.error('[NeuroEarly Telemetry Promise Rejection]:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}
