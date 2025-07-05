"use client";
import React, { useEffect, useState, DragEvent } from "react";
import { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";
import { currentUser } from "../../data/auth";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type State = Database["public"]["Tables"]["status"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Member = Database["public"]["Tables"]["member"]["Row"];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUsers, setCurrentUsers] = useState<Member[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({});
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const supabase = createClient();

  const fetchCurrentUser = async () => {
    const user = await currentUser();
    if (user) {
      const { data, error } = await supabase.from("member").select("*").eq("login_id", user.email);

      if (error) {
        console.error("Error fetching current user", error);
        return;
      }
      setCurrentUsers(data || []);
      // console.log(currentUsers)
    }
  };

  // プロジェクトを取得
  const fetchProject = async () => {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) {
      console.error("Project acquisition error", error);
      return;
    }
    
    // プロジェクトをソート（プロジェクト名でアルファベット順）
    const sortedProjects = (data || []).sort((a, b) => {
      const nameA = a.project_name || '';
      const nameB = b.project_name || '';
      return nameA.localeCompare(nameB);
    });
    
    setProjects(sortedProjects);
    
    // 最初のプロジェクトを自動選択
    if (sortedProjects.length > 0 && !selectedProject) {
      setSelectedProject(sortedProjects[0].id);
    }
  };

  // ステートを取得
  const fetchState = async (projectId: string) => {
    const { data, error } = await supabase
      .from("status")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index");

    if (error) {
      console.error("State acquisition error", error);
      return;
    }
    setStates(data || []);
    return data || [];
  };

  // タスクを取得
  const fetchTasks = async (stateIds: string[]) => {
    if (stateIds.length === 0) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .in("status_id", stateIds);

    if (error) {
      console.error("Tasks acquisition error", error);
      return;
    }
    setTasks(data || []);
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("member").select("*");
    if (error) {
      console.error("Member acquisition error", error);
      return;
    }
    setMembers(data || []);
  };

  // Update task state when dragged to a new state
  const updateTaskState = async (task: Task, newStateId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status_id: newStateId })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating task state", error);
      return;
    }

    // Refresh tasks to reflect the change
    const stateIds = states.map((state) => state.id);
    if (stateIds.length > 0) {
      await fetchTasks(stateIds);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer?.setData('text/plain', task.id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStateId: string) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status_id !== targetStateId) {
      updateTaskState(draggedTask, targetStateId);
    }

    setDraggedTask(null);
  };

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    const fetchData = async () => {
      await fetchProject();
      await fetchCurrentUser();
      await fetchMembers();
    };

    fetchData();
  }, []);

  // selectedProjectが変更されたらステートとタスクを取得
  useEffect(() => {
    const loadStatesAndTasks = async () => {
      if (!selectedProject) {
        setStates([]);
        setTasks([]);
        return;
      }
  
      const stateData = await fetchState(selectedProject);
      
      if (stateData && stateData.length > 0) {
        const stateIds = stateData.map((state) => state.id);
        await fetchTasks(stateIds);
      }
    };
  
    loadStatesAndTasks();
  }, [selectedProject]);

  // 新しいタスクを追加
  // addTask関数の修正版
  const addTask = async () => {
    if (!newTask.title || !newTask.status_id) {
      alert("Title and State are required.");
      return;
    }

    if (!currentUsers || currentUsers.length === 0) {
      alert("Current user information is not available.");
      return;
    }

    const taskToAdd = {
      ...newTask,
      creator: currentUsers[0].id,  // created_by → creator に変更
    };

    const { error } = await supabase.from("tasks").insert(taskToAdd);

    if (error) {
      console.error("Task addition error", error.message);
      return;
    }

    // タスクリストを更新
    const stateIds = states.map((state) => state.id);
    if (stateIds.length > 0) {
      await fetchTasks(stateIds);
    }

    // モーダルを閉じる
    handleCloseModal();
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされた時にボディのスクロールを有効化
      document.body.style.overflow = 'unset';
    };
  }, []);

  // モーダルを開く時にプロジェクトが選択されているかチェック
  const handleOpenModal = () => {
    if (!selectedProject) {
      alert("プロジェクトを選択してください。");
      return;
    }
    setIsDialogOpen(true);
    // モーダルが開いた時にボディのスクロールを無効化
    document.body.style.overflow = 'hidden';
  };

  // モーダルを閉じる処理
  const handleCloseModal = () => {
    setIsDialogOpen(false);
    setNewTask({});
    // モーダルが閉じた時にボディのスクロールを有効化
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="container mx-auto p-4">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Project Dashboard</h1>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Task
        </button>
      </div>

      {/* プロジェクト選択 */}
      <div className="mb-4">
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border p-2 w-1/2 rounded"
        >
          <option value="">プロジェクトを選択</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.project_name || '無題のプロジェクト'}
            </option>
          ))}
        </select>
      </div>

      {/* ステート表示 */}
      {selectedProject && (
        <div className="grid grid-flow-col gap-4 mt-4">
          {states.map((state) => {
            const tasksForState = tasks.filter(
              (task) => task.status_id === state.id
            );

            return (
              <div
                key={state.id}
                className="p-4 rounded-lg min-h-[300px] shadow-md"
                style={{
                  backgroundColor: state.status_color ? `${state.status_color}15` : '#f5f5f5',
                  borderTop: `4px solid ${state.status_color || '#6b7280'}`
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, state.id)}
              >
                <div className="flex items-center mb-4">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: state.status_color || '#6b7280' }}
                  ></div>
                  <h2 className="text-xl font-semibold">{state.status_name || '無題のステータス'}</h2>
                </div>

                {tasksForState.map((task) => {
                  const assignedToMember = members.find(
                    (member) => member.id === task.assignee
                  );
                  const createdByMember = members.find(
                    (member) => member.id === task.creator
                  );

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={`bg-white p-3 mb-2 rounded-lg shadow cursor-move border-l-4 hover:shadow-lg transition-shadow
                        ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                      style={{
                        borderLeftColor: state.status_color || '#6b7280'
                      }}
                    >
                      <h3 className="font-bold text-gray-900">{task.title || '無題のタスク'}</h3>
                      <p className="text-sm text-gray-600 mb-2">{task.description || ''}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          <p>担当: {assignedToMember ? assignedToMember.name : "未割り当て"}</p>
                          <p>作成者: {createdByMember ? createdByMember.name : "不明"}</p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: state.status_color || '#6b7280' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                {tasksForState.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">タスクがありません</p>
                    <p className="text-xs text-gray-400 mt-1">ここにタスクをドラッグ&ドロップできます</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* タスク追加モーダル */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opac z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[450px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">新しいタスクを追加</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">タイトル *</label>
                <input
                  type="text"
                  value={newTask.title || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="タスクのタイトルを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">説明</label>
                <textarea
                  value={newTask.description || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  placeholder="タスクの詳細を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">担当者</label>
                <select
                  value={newTask.assignee || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assignee: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">担当者を選択</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || '無名のメンバー'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">ステータス *</label>
                <select
                  value={newTask.status_id || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, status_id: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ステータスを選択</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.status_name || '無題のステータス'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={addTask}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                タスクを追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}