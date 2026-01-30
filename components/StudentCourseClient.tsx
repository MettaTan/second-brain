/**
 * Client Component Wrapper for Student Course Page
 * Handles guest ID generation, DB progress fetch, and passes to ChatInterface
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getOrCreateGuestId } from '@/lib/session';
import { BookOpen, X } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import CurriculumViewer from '@/components/CurriculumViewer';
import CompletionModal from '@/components/CompletionModal';
import { CourseSection } from '@/lib/types';

interface StudentCourseClientProps {
  botId: string;
  assistantId: string;
  botName: string;
  courseMap: CourseSection[] | any[];
}

export default function StudentCourseClient({
  botId,
  assistantId,
  botName,
  courseMap,
}: StudentCourseClientProps) {
  const [studentId, setStudentId] = useState<string>('');
  const [dbProgress, setDbProgress] = useState<string[] | null>(null);
  const [ready, setReady] = useState(false);
  // Parent state is ONLY for Chat context - it does NOT control the Viewer
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const hasShownCompletionRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate or retrieve guest ID, then fetch DB progress
  useEffect(() => {
    const init = async () => {
      const guestId = getOrCreateGuestId();
      setStudentId(guestId);

      // Fetch saved progress from DB (for cross-device persistence)
      try {
        const res = await fetch(
          `/api/progress/${botId}?studentId=${guestId}`
        );
        if (res.ok) {
          const data = await res.json();
          setDbProgress(data.completedIds || []);
        } else {
          setDbProgress([]);
        }
      } catch {
        setDbProgress([]);
      }

      setReady(true);
    };

    init();
  }, [botId]);

  // Debounced sync to DB on progress changes
  const syncToDb = useCallback(
    (ids: string[]) => {
      if (!studentId) return;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/progress/${botId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId,
              completedIds: ids,
            }),
          });
        } catch {
          // Silent fail — localStorage is the primary source
        }
      }, 1000);
    },
    [botId, studentId]
  );

  // Get total item count from courseMap
  const getTotalItems = useCallback(() => {
    if (!courseMap || courseMap.length === 0) return 0;
    const isHierarchical = 'items' in courseMap[0];
    if (isHierarchical) {
      return (courseMap as CourseSection[]).reduce(
        (sum, section) => sum + section.items.length,
        0
      );
    }
    return courseMap.length;
  }, [courseMap]);

  // Handle progress changes from CurriculumViewer (one-way communication)
  // This updates parent state for Chat context only - it does NOT affect the Viewer
  const handleProgressUpdate = (newIds: string[]) => {
    setCompletedModuleIds(newIds); // Update for Chat context only
    syncToDb(newIds); // Background sync to DB

    // Check for course completion
    const total = getTotalItems();
    if (total > 0 && newIds.length >= total && !hasShownCompletionRef.current) {
      hasShownCompletionRef.current = true;
      setShowCompletion(true);
    }
  };

  // Don't render until we have student ID and DB progress
  if (!ready || !studentId || dbProgress === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🧠</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">{botName}</h1>
              <p className="text-xs text-muted-foreground">
                AI Course Assistant
              </p>
            </div>
          </div>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-background rounded-lg transition-colors"
            aria-label="Open course outline"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content: Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Course Map */}
        <aside
          className={`
            ${sidebarOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'}
            md:relative md:flex
            w-80 border-r border-border bg-surface flex-shrink-0 flex flex-col overflow-hidden
          `}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
            <span className="font-semibold">Course Outline</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-background rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CurriculumViewer
            courseMap={courseMap || []}
            botId={botId}
            studentId={studentId}
            initialCompletedIds={dbProgress}
            onProgressChange={handleProgressUpdate}
          />
        </aside>

        {/* Right Main Area: Chat Interface */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            botId={botId}
            assistantId={assistantId}
            courseMap={[]} // Pass empty array to hide the built-in sidebar
            studentId={studentId}
            completedModuleIds={completedModuleIds}
          />
        </main>
      </div>

      {/* Completion Celebration */}
      {showCompletion && (
        <CompletionModal
          botName={botName}
          onClose={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
}
