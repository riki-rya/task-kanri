import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { signOut } from '@/components/auth';

export default async function Header() {
    return (
        <header className="h-16 border-b bg-white shadow-sm px-6 flex items-center justify-between">
            {/* ロゴ・ブランド名 */}
            <div className="flex items-center">
                <Button asChild variant="ghost" className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3">
                    <Link href="/">DEMO JIRA</Link>
                </Button>
            </div>

            {/* ナビゲーションメニュー */}
            <nav className="flex items-center space-x-1">
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2">
                    <Link href="/Dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2">
                    <Link href="/projects">Projects</Link>
                </Button>
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2">
                    <Link href="/inquiry">Inquiry</Link>
                </Button>
                <Button asChild variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2">
                    <Link href="/mypage">MyPage</Link>
                </Button>
            </nav>

            {/* ログアウトボタン */}
            <div className="flex items-center">
                <form action={signOut}>
                    <Button variant="outline" className="text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 px-4 py-2">
                        LogOut
                    </Button>
                </form>
            </div>
        </header>
    );
}