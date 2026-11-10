import { Component, type ReactNode } from "react";

import ErrorScreen from "@/components/ErrorScreen";
import { signalError } from "@/services/template-loader";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
  stack?: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  }

  componentDidCatch(error: Error): void {
    console.error("Template render error:", error);
    if (window.Loader) {
      signalError("Template render error: " + error.message);
    }
  }

  render() {
    if (this.state.message !== null) {
      return <ErrorScreen message={this.state.message} stack={this.state.stack} />;
    }
    return this.props.children;
  }
}
