import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[OperisAI] Unhandled crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-screen bg-[var(--color-editor-base)] flex flex-col items-center justify-center gap-6 text-center px-8">
          <div className="text-5xl">💥</div>
          <h2 className="font-heading font-bold text-2xl text-[var(--color-text-primary)]">
            Something went wrong
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-md text-sm leading-relaxed">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-accent text-white font-medium rounded-xl px-6 py-3 hover:opacity-90 transition-opacity active:scale-[0.97]"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
