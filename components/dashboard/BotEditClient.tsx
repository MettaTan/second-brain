/**
 * Client Component for Bot Edit Page
 * Handles curriculum editing and saving
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import CurriculumBuilder from '@/components/dashboard/CurriculumBuilder';
import { CourseSection } from '@/lib/types';

interface BotEditClientProps {
  botId: string;
  botName: string;
  initialCurriculum: CourseSection[];
  initialPassword?: string;
}

export default function BotEditClient({
  botId,
  botName,
  initialCurriculum,
  initialPassword,
}: BotEditClientProps) {
  const router = useRouter();
  const [curriculum, setCurriculum] = useState<CourseSection[]>(initialCurriculum);
  const [password, setPassword] = useState(initialPassword || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bot/${botId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_map: curriculum,
          password: password.trim() || null,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Failed to save changes: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Curriculum</h1>
            <p className="text-muted-foreground">
              {botName}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Curriculum Builder */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <CurriculumBuilder
          uploadedFiles={[]} // No new files to upload in edit mode
          curriculum={curriculum}
          onChange={setCurriculum}
        />
      </div>

      {/* Password Protection */}
      <div className="mt-6 bg-surface border border-border rounded-lg p-6">
        <label htmlFor="editPassword" className="block text-lg font-semibold mb-2">
          Password Protection
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Optional
          </span>
        </label>
        <p className="text-sm text-muted-foreground mb-4">
          Set a password to restrict student access. Leave empty for public access.
        </p>
        <input
          id="editPassword"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
          placeholder="Leave empty for public access"
        />
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-background border border-border rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> You can reorganize phases, add new items, and edit existing ones.
          Changes will be saved when you click &quot;Save Changes&quot;. File uploads are not available in edit mode.
        </p>
      </div>
    </div>
  );
}


