import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /** `reset` 을 호출하면 다시 그려 본다. */
  fallback: (error: unknown, reset: () => void) => ReactNode
}

type ErrorBoundaryState = {
  error: unknown
}

/**
 * 렌더 중 터진 예외를 붙잡아 흰 화면 대신 안내를 보여준다 (KAN-63 완료 조건).
 *
 * 라우트 안에서 난 오류는 라우터의 `errorElement` 가 먼저 받는다. 이 경계는
 * 라우터 바깥, 즉 앱 전체가 뜨지 못한 경우를 위한 마지막 그물이다.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // 원인 추적은 콘솔에 남긴다. 외부 수집은 별도 이슈에서 붙인다.
    console.error('처리되지 않은 오류', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error !== null) {
      return this.props.fallback(this.state.error, this.reset)
    }
    return this.props.children
  }
}

export default ErrorBoundary
