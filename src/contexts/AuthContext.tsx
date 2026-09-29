import { createContext, use } from 'react'
import type { Session } from '../types/domain'

export type AuthContextValue = {
  /** 현재 세션. 서버에 물어보기 전에는 `null` 이다. */
  session: Session | null
  /** 첫 세션 확인이 아직 끝나지 않았는지 */
  isRestoring: boolean
  /** 비밀번호로 로그인한다. 실패하면 ApiError 를 던진다. */
  signIn: (password: string) => Promise<Session>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** 인증 상태와 등급. */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext)
  if (!value) {
    throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.')
  }
  return value
}

/**
 * 지금 등급이 쓰기를 할 수 있는지.
 *
 * 등록·수정·삭제 진입점을 가릴 때 쓴다. 세션을 아직 모르는 동안에는 false 라서,
 * 확인되기 전에 버튼이 잠깐 보였다 사라지는 일이 없다.
 */
export function useCanEdit(): boolean {
  const { session } = useAuth()
  return session?.authenticated === true && session.tier === 'EDITOR'
}
