// Discord認証対応版 - page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, KanbanSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient();

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const HomePage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // 初回認証状態の確認を改善
    const checkAuth = async () => {
      try {
        // セッションを明示的に更新
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setUser(null);
        } else if (session?.user) {
          setUser(session.user as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // 認証状態の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user as User);
          if (event === 'SIGNED_IN') {
            showMessage('ログインに成功しました！', 'success');
          }
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            showMessage('ログアウトしました', 'success');
          }
        }
        setIsCheckingAuth(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleEmailAuth = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // 成功メッセージはonAuthStateChangeで処理
    } catch (error: unknown) {
      if (error instanceof Error) {
        showMessage(error.message || 'エラーが発生しました', 'error');
      } else {
        showMessage('不明なエラーが発生しました', 'error');
      }
    }
  };

  const handleDiscordAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error) {
        showMessage(error.message || 'Discord認証エラーが発生しました', 'error');
      } else {
        showMessage('Discord認証中に不明なエラーが発生しました', 'error');
      }
      setIsLoading(false);
    }
  };
  

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error) {
        showMessage(error.message || 'ログアウトに失敗しました', 'error');
      } else {
        showMessage('ログアウト中に不明なエラーが発生しました', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  


  // 認証状態確認中のローディング
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-2xl rounded-xl p-8 text-center space-y-6 border border-gray-100">
          <div className="flex justify-center mb-4">
            <KanbanSquare 
              className="text-blue-600 animate-pulse" 
              size={64} 
              strokeWidth={1.5}
            />
          </div>
          <div className="text-gray-600">認証状態を確認中...</div>
          <div className="text-xs text-gray-400">
            セッションを復元しています...
          </div>
        </div>
      </div>
    );
  }

  // ログイン済みの場合のダッシュボード
  if (user) {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            DEMO JIRA
          </h1>
          <p className="text-gray-600 mb-6">
            タスク管理を効率的に。プロジェクトの進捗を可視化。
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">ログイン済み</span>
            </div>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
          </div>

          <button
            onClick={() => router.push('/Dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 group flex items-center justify-center mb-3"
          >
            ダッシュボードへ
            <ArrowRight 
              className="ml-2 group-hover:translate-x-1 transition-transform" 
              size={20} 
            />
          </button>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg border ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {messageType === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 未ログインの場合のログインフォーム
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          DEMO JIRA
        </h1>
        <p className="text-gray-600 mb-6">
          タスク管理を効率的に。プロジェクトの進捗を可視化。
        </p>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          </div>
        )}

        {/* ソーシャルログインボタン */}
        <div className="space-y-3">
          <button
            onClick={handleDiscordAuth}
            disabled={isLoading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
            </svg>
            {isLoading ? '認証中...' : 'Discordでログイン'}
          </button>
        </div>

        {/* 区切り線 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        {/* ログインフォーム */}
        <div className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-gray-700 text-sm font-medium">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-12 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-gray-700 text-sm font-medium">パスワード</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-12 pr-12 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="パスワードを入力"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEmailAuth(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleEmailAuth}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center"
          >
            {isLoading ? '処理中...' : 'メールでログイン'}
            {!isLoading && (
              <ArrowRight 
                className="ml-2 group-hover:translate-x-1 transition-transform" 
                size={20} 
              />
            )}
          </button>

          <div className="text-center">
            <Link 
              href="/login"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              その他のログイン方法
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;