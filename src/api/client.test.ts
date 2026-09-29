import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { apiClient, setUnauthorizedListener } from './client'
import { ApiError } from './errors'

/** 서버 대신 정해진 상태 코드를 돌려주는 어댑터를 끼운다. */
function respondWith(status: number) {
  apiClient.defaults.adapter = (config: AxiosRequestConfig) => {
    const response = {
      status,
      data: {},
      statusText: '',
      headers: {},
      config,
    } as AxiosResponse
    return Promise.reject(
      new AxiosError('stub', String(status), config as never, null, response),
    )
  }
}

afterEach(() => {
  setUnauthorizedListener(null)
  apiClient.defaults.adapter = undefined
})

describe('apiClient 401 처리', () => {
  it('세션 쿠키를 함께 보낸다', () => {
    // 이게 꺼져 있으면 로그인해도 다음 요청에 세션이 실려 가지 않는다
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('일반 요청이 401 이면 세션이 끊긴 것으로 알린다', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedListener(onUnauthorized)
    respondWith(401)

    await expect(apiClient.get('/api/events')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('로그인 실패는 세션 만료로 치지 않는다', async () => {
    /*
     * 로그인 실패도 401 이다. 이것까지 만료로 취급하면 비밀번호를 틀린 순간
     * 화면이 리다이렉트되어 오류 메시지를 읽을 새가 없다.
     */
    const onUnauthorized = vi.fn()
    setUnauthorizedListener(onUnauthorized)
    respondWith(401)

    await expect(apiClient.post('/api/auth/login')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('세션 확인이 401 이어도 만료로 치지 않는다', async () => {
    // 미인증 상태에서 /me 를 부르는 것은 정상 흐름이다
    const onUnauthorized = vi.fn()
    setUnauthorizedListener(onUnauthorized)
    respondWith(401)

    await expect(apiClient.get('/api/auth/me')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('403 은 세션이 살아 있다는 뜻이라 내보내지 않는다', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedListener(onUnauthorized)
    respondWith(403)

    await expect(apiClient.post('/api/events')).rejects.toMatchObject({
      kind: 'FORBIDDEN',
    })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
