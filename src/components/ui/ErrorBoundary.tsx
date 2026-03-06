import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
            <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-danger" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Algo salió mal</h2>
            <p className="text-sm text-text-muted mb-6">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
