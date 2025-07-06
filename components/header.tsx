import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { signOut } from '@/components/auth';

export default async function Header() {
    return (
        <header className="h-16 border-b px-6 flex items-center">
            <Button asChild variant="ghost" className=""><Link href="/">DEMO JIRA</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/Dashboard">Dashboard</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/mypage">MyPage</Link></Button>
            <Button asChild variant="ghost" className=""><Link href="/projects">Projects</Link></Button>
            <span className="flex-1"></span>
                <form action={signOut}><Button variant="outline">LogOut</Button></form>
        </header>
    );
}
