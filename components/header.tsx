import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { currentUser } from '@/app/data/auth'
import { signOut } from '@/components/auth';

export default async function Header() {
    const user = await currentUser();
    console.log('User Exists:', !!user); // 条件分岐用の確認

    return (
        <header className="h-16 border-b px-6 flex items-center">
            <Button asChild variant="ghost" className=""><Link href="/">DEMO JIRA</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/Dashboard">Dashboard</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/mypage">MyPage</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/login">ログインページ</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/testpage">testpage</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/projects">projects</Link></Button>
            <span className="flex-1"></span>
            {user ? (
                <form action={signOut}><Button variant="outline">LogOut</Button></form>
            ) : (
                <Button asChild variant="ghost" className=""><Link href="/login">Login</Link></Button>
            )}
        </header>
    );
}
