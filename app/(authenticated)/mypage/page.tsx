"use client"
import React, { useState, useEffect } from 'react'
import { currentUser } from '../../data/auth'
import { Database } from '@/types/supabase'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

type member = Database['public']['Tables']['member']['Row']

export default function Page() {
    const [hensyuuButton, hensyuuButtonEdit] = useState(false); // 編集ボタンの状態
    const [userInfo, setUserInfo] = useState<member[]>([]);  // ユーザー情報
    const [editedUserInfo, setEditedUserInfo] = useState<member | null>(null); // 編集用のユーザー情報
    const [provider, setProvider] = useState<string | null>(null);

    useEffect(() => {
        fetchUserData()
    }, [])

    // ユーザー情報を取得
    async function fetchUserData() {
        const user = await currentUser();
        const supabase = createClient()

        if (user) {
            setProvider(user?.app_metadata?.provider || null);
            const { data, error } = await supabase
                .from('member')
                .select('*')
                .eq('login_id', user.email)

            if (error) {
                console.error('Error fetching data:', error)
                return
            }

            setUserInfo(data || []);  // ユーザー情報を保存
            setEditedUserInfo(data ? data[0] : null);  // 編集用のユーザー情報も設定
        } else {
            console.error('Error: user info error')
        }
    }

    // 編集ボタンをクリックしたときの動作
    const handleEditClick = () => {
        hensyuuButtonEdit(!hensyuuButton);  // 編集モードを切り替え
    }

    // ユーザー情報の変更をハンドル
    const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editedUserInfo) {
            setEditedUserInfo({
                ...editedUserInfo,
                [e.target.name]: e.target.value, // 入力された値で変更
            });
        }
    }

    // 編集内容を保存する
    const handleSave = async () => {
        if (editedUserInfo) {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('member')
                .upsert(editedUserInfo)
                .eq('id', editedUserInfo.id);
            if (error) {
                console.error('Error updating user info:', error);
                return;
            }
            console.log(data)

            hensyuuButtonEdit(false);  // 編集モードを終了
            setUserInfo([editedUserInfo]); // userInfoにeditedUserInfoの情報を入れる
        }
    }

    return (
        <div className="flex flex-col items-center justify-start gap-6 mt-8 p-4">
            {hensyuuButton ? (
                <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6">
                    {editedUserInfo && (
                        <div className="flex flex-col gap-4">
                            <h3 className="font-bold text-2xl text-center mb-4">編集フォーム</h3>

                            {/* 名前入力 */}
                            <div>
                                <label className="block mb-2 font-semibold">名前:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editedUserInfo.name || ""}
                                    onChange={handleUserInfoChange}
                                    className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* メール入力 */}
                            <div className="mt-4">
                                <label className="block mb-2 font-semibold">メール:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editedUserInfo.login_id || ""}
                                    onChange={handleUserInfoChange}
                                    className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* ボタン群 */}
                            <div className="flex gap-4 mt-6 justify-center">
                                <Button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    保存
                                </Button>
                                <Button
                                    onClick={() => hensyuuButtonEdit(false)}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    キャンセル
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6">
                    {userInfo.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3 className="font-bold text-2xl text-center mb-4">ユーザー情報</h3>
                            <div>
                                <p className="mb-2">
                                    <strong>名前:</strong> {userInfo[0].name}
                                </p>
                                <p>
                                    <strong>メール:</strong> {userInfo[0].login_id}
                                </p>
                                <p className="flex items-center gap-2">
                                    <strong>Author:</strong>
                                    {provider === 'email' && <Mail className="w-5 h-5 text-gray-600" />}
                                    {provider === 'discord' &&
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
                                        </svg>
                                    }
                                    <span className="ml-1 text-sm text-gray-700">{provider}</span>
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    onClick={handleEditClick}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    編集
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );


}
