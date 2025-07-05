// /app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { KanbanSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからコードとセッションを取得
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage(error.message || '認証処理でエラーが発生しました')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('ログインに成功しました！リダイレクトしています...')
          
          // 少し待ってからリダイレクト
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('認証セッションが見つかりません')
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('error')
        setMessage('予期しないエラーが発生しました')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  const handleRetry = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-xl p-8 text-center space-y-6 border border-gray-100">
        <div className="flex justify-center mb-4">
          <KanbanSquare 
            className="text-blue-600" 
            size={64} 
            strokeWidth={1.5}
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          認証処理中
        </h1>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-gray-600">
              認証情報を処理しています...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm font-medium">
                {message}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">
                {message}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}