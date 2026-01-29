/**
 * CurriculumViewer Component
 * Read-only course map viewer for students
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, FileText, Video, Link as LinkIcon, ClipboardList } from 'lucide-react';
import { CourseModule, CourseSection, CourseItem, ItemType } from '@/lib/types';

interface CurriculumViewerProps {
  courseMap: CourseModule[] | CourseSection[];
  botId: string;
  studentId?: string; // Add studentId prop for per-user storage
  initialCompletedIds?: string[]; // INITIALIZATION ONLY: Used once on mount, then ignored
  onItemClick?: (item: CourseItem) => void;
  onProgressChange?: (completedIds: string[]) => void; // Callback to expose progress to parent (one-way)
}

export default function CurriculumViewer({
  courseMap,
  botId,
  studentId,
  initialCompletedIds = [], // INITIALIZATION ONLY: Used once on mount, then ignored
  onItemClick,
  onProgressChange,
}: CurriculumViewerProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isToggling, setIsToggling] = useState(false);
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);
  
  // Storage key for this user/bot combination
  const storageKey = `progress_${botId}_${studentId || 'guest'}`;
  
  // SOVEREIGN STATE: Initialize from localStorage first (user's latest truth), then fallback to initial prop
  // This component is the sole authority for checkbox state - it does NOT sync from parent after mount
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>(() => {
    // 1. Try LocalStorage first (User's latest truth)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const savedIds = Array.isArray(parsed) ? parsed : [];
          console.log('📂 Viewer: Initialized from localStorage:', {
            storageKey,
            count: savedIds.length,
            ids: savedIds,
          });
          
          // Filter out stale IDs that don't exist in current courseMap
          const getValidIds = (): string[] => {
            const isHierarchical = courseMap && courseMap.length > 0 && 'items' in courseMap[0];
            if (isHierarchical) {
              const sections = courseMap as CourseSection[];
              return sections.flatMap(section => section.items.map(item => item.id));
            } else {
              const modules = courseMap as CourseModule[];
              return modules.map(module => module.id);
            }
          };
          
          const validIds = getValidIds();
          const filteredIds = savedIds.filter(id => validIds.includes(id));
          
          if (filteredIds.length !== savedIds.length) {
            // Clean up stale IDs
            localStorage.setItem(storageKey, JSON.stringify(filteredIds));
            console.log('🧹 Viewer: Cleaned stale IDs from localStorage');
          }
          
          return filteredIds;
        } catch (error) {
          console.error('❌ Viewer: Failed to parse localStorage:', error);
        }
      }
    }
    
    // 2. Fallback to Server Data (only on first load, if no localStorage)
    console.log('📂 Viewer: Initialized from initialCompletedIds prop:', {
      count: initialCompletedIds.length,
      ids: initialCompletedIds,
    });
    return initialCompletedIds || [];
  });
  
  // CRITICAL: NO useEffect that syncs from props
  // This component is sovereign - it only uses initialCompletedIds for initialization
  // After mount, it manages its own state and ignores parent updates

  const isHierarchical = courseMap && courseMap.length > 0 && 'items' in courseMap[0];

  // Get all valid item/module IDs from the current courseMap
  const getValidIds = (): string[] => {
    if (isHierarchical) {
      const sections = courseMap as CourseSection[];
      return sections.flatMap(section => section.items.map(item => item.id));
    } else {
      const modules = courseMap as CourseModule[];
      return modules.map(module => module.id);
    }
  };

  // This component is SOVEREIGN - it manages its own state
  // Parent's initialCompletedIds is only used for initialization
  // After mount, this component is the sole authority for checkbox state

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleToggle = (itemId: string) => {
    console.log('🖱️ Checkbox clicked:', itemId);
    
    if (isToggling) {
      console.log('⏸️ Toggle already in progress, ignoring click');
      return;
    }

    // Calculate new state based on current LOCAL state (this component is sovereign)
    const isAlreadyChecked = completedModuleIds.includes(itemId);
    let newIds: string[];
    
    if (isAlreadyChecked) {
      console.log('❌ Unchecking item:', itemId);
      newIds = completedModuleIds.filter(id => id !== itemId);
    } else {
      console.log('✅ Checking item:', itemId);
      newIds = [...completedModuleIds, itemId];
    }

    // Update local state immediately (sovereign authority - no parent can override)
    setCompletedModuleIds(newIds);
    
    // One-way communication: Notify parent for Chat context (parent does NOT control this component)
    if (onProgressChange) {
      console.log('📤 Notifying parent of progress change (one-way):', newIds.length, 'items');
      onProgressChange(newIds);
    }

    // Save to localStorage immediately
    console.log('💾 Saving to localStorage immediately...');
    localStorage.setItem(storageKey, JSON.stringify(newIds));
    console.log('✅ localStorage updated:', {
      storageKey,
      newCount: newIds.length,
      newIds,
    });

    // Set loading state for visual feedback
    setIsToggling(true);
    setTogglingModuleId(itemId);

    // Simulate async operation (for future server sync)
    setTimeout(() => {
      setIsToggling(false);
      setTogglingModuleId(null);
      console.log('✨ Toggle animation complete');
    }, 300);
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'file':
        return <FileText className="w-3 h-3 text-blue-500" />;
      case 'video':
        return <Video className="w-3 h-3 text-purple-500" />;
      case 'quiz':
        return <ClipboardList className="w-3 h-3 text-green-500" />;
      case 'link':
        return <LinkIcon className="w-3 h-3 text-orange-500" />;
    }
  };

  if (!courseMap || courseMap.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">No course outline available.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold mb-2">Course Outline</h3>
        <p className="text-xs text-muted-foreground">
          Track your progress by clicking items as you complete them
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isHierarchical ? (
          /* Hierarchical Structure: Phases with Items */
          <div className="space-y-3">
            {(courseMap as CourseSection[]).map((section) => {
              const isCollapsed = collapsedSections.has(section.id);
              const sectionCompletedCount = section.items.filter(item => 
                completedModuleIds.includes(item.id)
              ).length;
              
              return (
                <div key={section.id} className="space-y-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-sm">{section.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sectionCompletedCount}/{section.items.length}
                    </span>
                  </button>
                  
                  {/* Section Items */}
                  {!isCollapsed && (
                    <div className="space-y-1 ml-2 pl-4 border-l-2 border-border">
                      {section.items.map((item) => {
                        const isCompleted = completedModuleIds.includes(item.id);
                        const isTogglingItem = togglingModuleId === item.id;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              handleToggle(item.id);
                              if (onItemClick) onItemClick(item);
                            }}
                            disabled={isTogglingItem}
                            className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {isTogglingItem ? (
                              <Loader2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.type !== 'file' && getItemIcon(item.type)}
                                <span className={`text-xs ${isCompleted ? 'text-foreground line-through' : 'text-muted-foreground'}`}>
                                  {item.title}
                                </span>
                              </div>
                              {item.external_url && (
                                <a
                                  href={item.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-primary hover:underline mt-1 block truncate"
                                >
                                  {item.external_url}
                                </a>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Structure: Simple List (Backwards Compatible) */
          <div className="space-y-2">
            {(courseMap as CourseModule[]).map((module) => {
              const isCompleted = completedModuleIds.includes(module.id);
              const isTogglingItem = togglingModuleId === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleToggle(module.id)}
                  disabled={isTogglingItem}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-surface border border-border hover:border-primary transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTogglingItem ? (
                    <Loader2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${isCompleted ? 'text-foreground line-through' : 'text-muted-foreground'}`}>
                    {module.title}
                  </p>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Progress Summary */}
        <div className="mt-6 pt-4 border-t border-border">
          {isHierarchical ? (
            <>
              {(() => {
                const validIds = getValidIds();
                const completedCount = completedModuleIds.filter(id => validIds.includes(id)).length;
                const total = validIds.length;
                return (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Progress: {completedCount} / {total} items
                    </p>
                    <div className="w-full bg-background rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${total > 0 ? (completedCount / total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <>
              {(() => {
                const validIds = getValidIds();
                const completedCount = completedModuleIds.filter(id => validIds.includes(id)).length;
                const total = validIds.length;
                return (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Progress: {completedCount} / {total} modules
                    </p>
                    <div className="w-full bg-background rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${total > 0 ? (completedCount / total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}



