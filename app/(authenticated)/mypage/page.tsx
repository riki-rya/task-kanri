"use client"
import React, { useState, useEffect } from 'react'
import { currentUser } from '../../data/auth'
import { Database } from '@/types/supabase'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

type member = Database['public']['Tables']['member']['Row']

export default function Page() {
    const [hensyuuButton, hensyuuButtonEdit] = useState(false); // 編集ボタンの状態
    const [userInfo, setUserInfo] = useState<member[]>([]);  // ユーザー情報
    const [editedUserInfo, setEditedUserInfo] = useState<member | null>(null); // 編集用のユーザー情報

    useEffect(() => {
        fetchUserData()
    }, [])

    // ユーザー情報を取得
    async function fetchUserData() {
        const user = await currentUser();
        const supabase = createClient()

        if (user) {
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
