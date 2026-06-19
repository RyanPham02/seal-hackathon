"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary that catches the `removeChild` / `insertBefore` DOM errors
 * caused by Google Translate modifying the DOM behind React's back.
 *
 * When Google Translate replaces TextNodes with translated versions, React can
 * no longer find the original nodes and crashes with:
 *   "Failed to execute 'removeChild' on 'Node'"
 *   "Failed to execute 'insertBefore' on 'Node'"
 *
 * This boundary silently recovers by re-rendering its children, which
 * effectively resets the sub-tree to a clean state.
 */
export default class GoogleTranslateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Only catch errors that originate from Google-Translate DOM mutations
    if (
      error.message?.includes("removeChild") ||
      error.message?.includes("insertBefore") ||
      error.message?.includes("The node to be removed is not a child of this node")
    ) {
      return { hasError: true };
    }
    // Let other errors propagate normally
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Silently log – this is an expected side-effect of Google Translate
    console.warn(
      "[GoogleTranslateErrorBoundary] Caught DOM mutation error (likely Google Translate):",
      error.message,
      info.componentStack
    );
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    // Auto-recover: reset the error flag on the next tick so the children
    // re-render with fresh DOM nodes.
    if (this.state.hasError && !prevState.hasError) {
      requestAnimationFrame(() => {
        this.setState({ hasError: false });
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Return null briefly; componentDidUpdate will reset the flag and
      // children will re-appear on the next frame.
      return null;
    }
    return this.props.children;
  }
}
