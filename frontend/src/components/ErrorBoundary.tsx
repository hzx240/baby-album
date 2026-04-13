import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 使下一次渲染能够显示降级 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以将错误日志上报给服务器
    console.error('Error caught by boundary:', error, errorInfo);

    // 这里可以集成错误监控服务，如 Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 自定义错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="text-center mb-6 animate-bounce-soft">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="card p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                哎呀，出错了
              </h1>

              <p className="text-gray-600 mb-6">
                抱歉，应用程序遇到了意外错误。我们已经记录了这个问题，请稍后重试。
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-mono text-red-700 break-all">
                    Error: {this.state.error?.toString() || 'Unknown error'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  <span>重新加载</span>
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 btn-outline"
                >
                  返回首页
                </button>
              </div>
            </div>

            {/* Support Link */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>如果问题持续存在，请联系技术支持</p>
              <button
                onClick={() => window.location.href = 'mailto:support@example.com'}
                className="text-primary-600 hover:underline"
              >
                support@example.com
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
