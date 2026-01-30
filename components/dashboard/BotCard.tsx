/**
 * BotCard Component
 * Displays bot information with management options (Rename, Edit, Delete)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MessageSquare, MoreVertical, Edit, Trash2, Pencil, MessagesSquare, Copy } from 'lucide-react';
import { Bot } from '@/lib/types';
import ShareLinkSection from '@/components/dashboard/ShareLinkSection';

interface BotCardProps {
  bot: Bot;
  onDelete?: () => void;
}

export default function BotCard({ bot, onDelete }: BotCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newName, setNewName] = useState(bot.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === bot.name) {
      setShowRenameDialog(false);
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/bot/${bot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        router.refresh();
        setShowRenameDialog(false);
      } else {
        const data = await response.json();
        alert(`Failed to rename bot: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Rename error:', error);
      alert('Failed to rename bot. Please try again.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bot/${bot.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (onDelete) {
          onDelete();
        } else {
          router.refresh();
        }
        setShowDeleteConfirm(false);
      } else {
        const data = await response.json();
        alert(`Failed to delete bot: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete bot. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    setShowMenu(false);
    try {
      const response = await fetch(`/api/admin/bots/${bot.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Failed to duplicate bot: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate bot. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      <div className={`bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors relative ${isDuplicating ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* More Options Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-4 right-4 p-2 hover:bg-background rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            {/* Menu */}
            <div className="absolute top-12 right-4 z-20 bg-surface border border-border rounded-lg shadow-lg min-w-[180px]">
              <button
                onClick={() => {
                  setShowRenameDialog(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Rename</span>
              </button>
              <Link
                href={`/bot/${bot.id}/edit`}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                onClick={() => setShowMenu(false)}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Edit Curriculum</span>
              </Link>
              <Link
                href={`/bot/${bot.id}/conversations`}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                onClick={() => setShowMenu(false)}
              >
                <MessagesSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">View Conversations</span>
              </Link>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Duplicate</span>
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-500 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </>
        )}

        {/* Bot Header */}
        <div className="flex items-start justify-between mb-4 pr-8">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{bot.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(bot.created_at || '').toLocaleDateString('en-US')}
            </div>
          </div>
        </div>

        {/* Course Map Preview */}
        {bot.course_map && Array.isArray(bot.course_map) && bot.course_map.length > 0 && (
          <div className="mb-4 p-3 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Course Modules:
            </p>
            <ul className="space-y-1">
              {(() => {
                // Handle both flat and hierarchical structures
                const isHierarchical = 'items' in bot.course_map[0];
                const items = isHierarchical
                  ? (bot.course_map as any[]).flatMap((section: any) => section.items || [])
                  : bot.course_map;

                return items.slice(0, 3).map((item: any) => (
                  <li key={item.id} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item.title}
                  </li>
                ));
              })()}
              {(() => {
                const isHierarchical = 'items' in bot.course_map[0];
                const totalItems = isHierarchical
                  ? (bot.course_map as any[]).reduce((sum: number, section: any) => sum + (section.items?.length || 0), 0)
                  : bot.course_map.length;
                return totalItems > 3 ? (
                  <li className="text-sm text-muted-foreground">
                    +{totalItems - 3} more
                  </li>
                ) : null;
              })()}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Admin Chat Link */}
          <Link
            href={`/c/${bot.id}`}
            target="_blank"
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Open Chat (Admin)
          </Link>

          {/* Student Access Section */}
          <ShareLinkSection botId={bot.id} />
        </div>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rename Bot</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setShowRenameDialog(false);
                  setNewName(bot.name);
                }
              }}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg mb-4 focus:outline-none focus:border-primary"
              placeholder="Bot name"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRenameDialog(false);
                  setNewName(bot.name);
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isRenaming}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={isRenaming || !newName.trim() || newName === bot.name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenaming ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Bot</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{bot.name}</strong>? This action cannot be undone. All associated conversations and data will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

