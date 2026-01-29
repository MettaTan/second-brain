/**
 * Client Component Wrapper for Student Course Page
 * Handles guest ID generation and passes it to ChatInterface
 */

'use client';

import { useEffect, useState } from 'react';
import { getOrCreateGuestId } from '@/lib/session';
import ChatInterface from '@/components/ChatInterface';
import CurriculumViewer from '@/components/CurriculumViewer';
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
  // Parent state is ONLY for Chat context - it does NOT control the Viewer
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);

  // Generate or retrieve guest ID on mount
  useEffect(() => {
    const guestId = getOrCreateGuestId();
    console.log('🆔 Guest ID generated/retrieved:', guestId);
    setStudentId(guestId);
  }, []);

  // Handle progress changes from CurriculumViewer (one-way communication)
  // This updates parent state for Chat context only - it does NOT affect the Viewer
  const handleProgressUpdate = (newIds: string[]) => {
    console.log('🔄 Parent receiving new progress from Viewer:', newIds.length, 'items');
    setCompletedModuleIds(newIds); // Update for Chat context only
  };

  // Don't render until we have a student ID
  if (!studentId) {
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
      {/* Minimal Header */}
      <header className="border-b border-border bg-surface px-6 py-4 flex-shrink-0">
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
      </header>

      {/* Main Content: Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Course Map */}
        <aside className="w-80 border-r border-border bg-surface flex-shrink-0 flex flex-col overflow-hidden">
          <CurriculumViewer
            courseMap={courseMap || []}
            botId={botId}
            studentId={studentId}
            initialCompletedIds={[]} // INITIALIZATION ONLY: Viewer loads from localStorage itself
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
    </div>
  );
}

