import React, { FC, Component, ReactNode, ErrorInfo } from "react";
import { Box, Typography, Button, SxProps, Theme } from "@mui/material";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackRender?: (error: Error | null) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Styles for the error container
 */
const errorContainerStyles: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
  p: 3,
  textAlign: "center",
  borderRadius: 2,
  border: "1px solid",
  borderColor: "error.light",
  bgcolor: "error.lighter",
};

/**
 * Default error fallback UI
 */
const DefaultErrorFallback: FC<{ error: Error | null }> = ({ error }) => (
  <Box sx={errorContainerStyles}>
    <Typography variant="h5" color="error" gutterBottom>
      Something went wrong
    </Typography>
    <Typography variant="body1" gutterBottom>
      {error?.message || "An unexpected error occurred"}
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => window.location.reload()}
      sx={{ mt: 2 }}
    >
      Try Again
    </Button>
  </Box>
);

/**
 * This internal class is needed because error boundaries must be class components
 * in React's current implementation
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Component error:", error, errorInfo);
  }

  render(): ReactNode {
    const { children, fallbackRender } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // If a custom fallback renderer is provided, use it
      if (fallbackRender) {
        return fallbackRender(error);
      }
      
      // Otherwise use the default error UI
      return <DefaultErrorFallback error={error} />;
    }

    return children;
  }
}

/**
 * ErrorBoundary component
 * 
 * Catches JavaScript errors in its child component tree and displays
 * a fallback UI instead of crashing the whole application.
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example With custom fallback
 * <ErrorBoundary 
 *   fallbackRender={(error) => <div>Custom error: {error?.message}</div>}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
const ErrorBoundary: FC<ErrorBoundaryProps> = ({ children, fallbackRender }) => {
  return (
    <ErrorBoundaryClass fallbackRender={fallbackRender}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;
