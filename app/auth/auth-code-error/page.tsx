// /app/auth/auth-code-error/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { KanbanSquare, AlertCircle, ArrowRight } from 'lucide-react'

export default function AuthCodeError() {
  const router = useRouter()

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
          認証エラー
        </h1>

        <div className="flex items-center justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm font-medium mb-2">
            認証処理に失敗しました
          </p>
          <p className="text-red-600 text-xs">
            Discord認証中にエラーが発生しました。もう一度お試しください。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 group flex items-center justify-center"
          >
            ログインページに戻る
            <ArrowRight 
              className="ml-2 group-hover:translate-x-1 transition-transform" 
              size={20} 
            />
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            ページを再読み込み
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>問題が続く場合は、以下をお試しください：</p>
          <ul className="mt-2 text-left list-disc list-inside space-y-1">
            <li>ブラウザのキャッシュをクリア</li>
            <li>プライベートモードで再試行</li>
            <li>別のブラウザで再試行</li>
          </ul>
        </div>
      </div>
    </div>
  )
}