import { useEffect, useState } from 'react'
import { apiClient } from './api/client'
import './App.css'

function App() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    apiClient
      .get('/api/health')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <section id="center">
      <h1>Lab Calendar</h1>
      <p>
        Backend status:{' '}
        {status === 'loading' && '확인 중...'}
        {status === 'ok' && '✅ 연결됨'}
        {status === 'error' && '❌ 연결 실패 (백엔드가 실행 중인지 확인하세요)'}
      </p>
    </section>
  )
}

export default App
