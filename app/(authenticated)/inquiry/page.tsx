'use client'
import React, { useState, ChangeEvent, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { currentUser } from '../../data/auth'
import { createClient } from '@/utils/supabase/client'

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

interface FormErrors {
  [key: string]: string;
}

// UserData型をmember型に合わせて修正
interface UserData {
  id: string;
  email: string;
  name?: string;
  login_id?: string;
  created_at?: string;
}

interface InquiryData {
  category: string;
  subject: string;
  message: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string;
}

export default function InquiryPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUserData()
  }, [])

  // ユーザー情報を取得
  async function fetchUserData() {
    try {
      setIsLoading(true);
      const currentUserData = await currentUser();
      const supabase = createClient()

      if (currentUserData) {
        const { data, error } = await supabase
          .from('member')
          .select('*')
          .eq('login_id', currentUserData.email)

        if (error) {
          console.error('Error fetching user data:', error)
          setErrors(prev => ({ ...prev, user: 'ユーザー情報の取得に失敗しました' }));
          return
        }
        
        // UserData型に合わせてデータを設定
        if (data && data.length > 0) {
          const userData: UserData = {
            id: data[0].id || '',
            email: data[0].login_id || '',
            name: data[0].name || '',
            login_id: data[0].login_id || '',
            created_at: data[0].created_at || ''
          };
          setUser(userData);
          
          // フォームデータを事前入力
          setFormData(prev => ({
            ...prev,
            name: userData.name || '',
            email: userData.email || ''
          }));
        }
      } else {
        console.log('No user logged in');
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setErrors(prev => ({ ...prev, user: 'ユーザー情報の取得中にエラーが発生しました' }));
    } finally {
      setIsLoading(false);
    }
  }

  const categories = [
    { value: 'general', label: '一般的なお問い合わせ' },
    { value: 'technical', label: '技術的な問題' },
    { value: 'feature', label: '機能の要望' },
    { value: 'billing', label: '料金について' },
    { value: 'other', label: 'その他' }
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = '件名を入力してください';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'お問い合わせ内容を入力してください';
    } else if (formData.message.length < 10) {
      newErrors.message = '10文字以上入力してください';
    } else if (formData.message.length > 500) {
      newErrors.message = '500文字以内で入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSubmit関数の修正部分
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 送信データを準備
      const inquiryData: InquiryData = {
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
        user_id: user?.id || null,
        user_email: user?.email || formData.email,
        user_name: user?.name || formData.name,
        submitted_at: new Date().toISOString(),
        ip_address: null, // 実際の実装では取得可能
        user_agent: navigator.userAgent
      };

      // 1. Supabaseにデータを保存
      const supabase = createClient();
      
      console.log('Sending inquiry data:', inquiryData);
      
      const { data: inquiry, error: dbError } = await supabase
        .from('inquiries')
        .insert([inquiryData])
        .select()
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`データベースエラー: ${dbError.message}`);
      }

      console.log('Inquiry saved successfully:', inquiry);

      // 2. Webhook送信（修正版）
      try {
        await sendWebhook(inquiryData);
        console.log('Webhook処理完了');
      } catch (webhookError) {
        console.error('Webhook送信に失敗しましたが、処理は続行します:', webhookError);
        // Webhookの失敗は警告として表示するが、処理は続行
        setErrors(prev => ({ 
          ...prev, 
          webhook: 'お問い合わせは正常に送信されましたが、通知の送信に失敗しました。' 
        }));
      }
      
      setIsSubmitted(true);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      // webhook警告がある場合はクリア
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.webhook;
        return newErrors;
      });
      
    } catch (error) {
      console.error('送信エラー:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Webhook送信関数
  const sendWebhook = async (data: InquiryData) => {
    try {
      console.log('Sending webhook with data:', data);
      
      const response = await fetch('/api/send-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // レスポンスの内容を取得
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Webhook failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error
        });
        throw new Error(`Webhook送信失敗: ${response.status} - ${responseData.error || 'Unknown error'}`);
      }

      console.log('Webhook送信成功:', responseData);
      return responseData;
    } catch (error) {
      console.error('Webhook送信エラー:', error);
      
      // エラーの詳細をログに記録
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Webhookの失敗は全体の処理を止めないが、ユーザーには通知
      throw error; // エラーを再スローしてhandleSubmitで処理
    }
  };

  // 管理者通知メール送信
//   const sendNotificationEmail = async (data: InquiryData) => {
//     try {
//       // Edge Functionsやサーバーサイドで実装
//       const response = await fetch('/api/send-notification', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           type: 'inquiry_notification',
//           inquiry: data
//         })
//       });

//       if (!response.ok) {
//         throw new Error('通知メール送送信失敗');
//       }
//     } catch (error) {
//       console.error('通知メール送信エラー:', error);
//     }
//   };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // エラーがある場合、入力時にクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">送信完了</h2>
          <p className="text-gray-600 mb-6">
            お問い合わせありがとうございます。<br />
            担当者より3営業日以内にご連絡いたします。
          </p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            新しいお問い合わせ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">お問い合わせ</h1>
          <p className="text-gray-600 mt-2">ご質問やご要望がございましたら、お気軽にお問い合わせください。</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              お問い合わせフォーム
              {user && (
                <span className="text-sm font-normal text-gray-500 block mt-1">
                  ログイン中: {user.name || user.email}
                </span>
              )}
            </h2>

            {/* ユーザーデータ取得エラーの表示 */}
            {errors.user && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.user}
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* カテゴリー */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  お問い合わせ種別
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* 名前 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="山田太郎"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* メールアドレス */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 件名 */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="お問い合わせの件名を入力してください"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* メッセージ */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="お問い合わせの詳細な内容をご記入ください..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.message ? (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.message}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {formData.message.length}/500文字
                    </p>
                  )}
                </div>
              </div>

              {/* エラーメッセージ */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.submit}
                  </p>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      送信する
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}