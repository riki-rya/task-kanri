import Link from "next/link";
import { currentUser } from "./data/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, KanbanSquare } from "lucide-react";

export default async function Home() {
  const user = await currentUser();
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
        {user ? (
          <Button 
            variant="default" 
            className="w-full group"
            asChild
          >
            <Link href="/Dashboard" className="flex items-center justify-center">
              ダッシュボードへ
              <ArrowRight 
                className="ml-2 group-hover:translate-x-1 transition-transform" 
                size={20} 
              />
            </Link>
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full group border-blue-500 text-blue-600 hover:bg-blue-50"
            asChild
          >
            <Link href="/login" className="flex items-center justify-center">
              ログイン
              <ArrowRight 
                className="ml-2 group-hover:translate-x-1 transition-transform" 
                size={20} 
              />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}