/**
 * Course Progress Resolution
 * 
 * Safely resolves completed module IDs to their titles,
 * handling mismatches and unknown IDs gracefully.
 */

import { CourseSection, CourseItem, CourseModule } from '@/lib/types';

/**
 * Flatten a hierarchical course map into a flat array of items
 */
export function flattenCourseMap(
  courseMap: CourseSection[] | CourseModule[]
): Array<{ id: string; title: string }> {
  const items: Array<{ id: string; title: string }> = [];
  
  // Check if hierarchical structure
  const isHierarchical = courseMap.length > 0 && 'items' in courseMap[0];
  
  if (isHierarchical) {
    // Hierarchical: iterate through sections and items
    for (const section of courseMap as CourseSection[]) {
      if (section.items && Array.isArray(section.items)) {
        for (const item of section.items) {
          if (item && item.id && item.title) {
            items.push({ 
              id: String(item.id), // Ensure string
              title: item.title 
            });
          }
        }
      }
    }
  } else {
    // Flat structure: direct modules
    for (const module of courseMap as CourseModule[]) {
      if (module && module.id && module.title) {
        items.push({ 
          id: String(module.id), // Ensure string
          title: module.title 
        });
      }
    }
  }
  
  return items;
}

/**
 * Result of resolving completed module IDs to titles
 */
export interface ResolvedProgress {
  /** Successfully resolved module titles */
  titles: string[];
  /** IDs that could not be matched to any module */
  unmatchedIds: string[];
}

/**
 * Resolve completed module IDs to their titles
 * 
 * @param courseMap - The course map (hierarchical or flat)
 * @param completedModuleIds - Array of module IDs from the client
 * @returns Object with resolved titles and unmatched IDs
 * 
 * @example
 * const result = resolveCompletedTitles(courseMap, ["phase-1/item-1", "unknown-id"]);
 * // result.titles = ["Module 1 Title"]
 * // result.unmatchedIds = ["unknown-id"]
 */
export function resolveCompletedTitles(
  courseMap: CourseSection[] | CourseModule[] | null | undefined,
  completedModuleIds: string[] | null | undefined
): ResolvedProgress {
  // Handle empty inputs
  if (!courseMap || !Array.isArray(courseMap) || courseMap.length === 0) {
    return {
      titles: [],
      unmatchedIds: completedModuleIds || [],
    };
  }
  
  if (!completedModuleIds || completedModuleIds.length === 0) {
    return {
      titles: [],
      unmatchedIds: [],
    };
  }
  
  // Flatten course map and create lookup
  const flatItems = flattenCourseMap(courseMap);
  const idToTitleMap = new Map<string, string>();
  
  for (const item of flatItems) {
    idToTitleMap.set(item.id, item.title);
  }
  
  // Resolve each completed ID
  const titles: string[] = [];
  const unmatchedIds: string[] = [];
  
  // Normalize all IDs to strings
  const normalizedIds = completedModuleIds.map(id => String(id));
  
  for (const id of normalizedIds) {
    const title = idToTitleMap.get(id);
    if (title) {
      titles.push(title);
    } else {
      unmatchedIds.push(id);
    }
  }
  
  return { titles, unmatchedIds };
}

/**
 * Phase progress information
 */
export interface PhaseProgress {
  phaseId: string;
  phaseTitle: string;
  total: number;
  completed: number;
  isComplete: boolean;
  remainingTitles: string[];
}

/**
 * Overall course progress with phase breakdown
 */
export interface CourseProgressSummary {
  totalModules: number;
  completedModules: number;
  phases: PhaseProgress[];
}

/**
 * Compute phase-aware progress from course map and completed IDs
 * 
 * @param courseMap - The course map (hierarchical or flat)
 * @param completedModuleIds - Array of completed module IDs from client
 * @returns Phase-by-phase progress summary
 * 
 * @example
 * const summary = computePhaseProgress(courseMap, ["id1", "id2"]);
 * // summary.phases[0] = { phaseId: "phase-1", phaseTitle: "Phase 1", total: 5, completed: 2, isComplete: false, remainingTitles: ["Item 3", "Item 4", "Item 5"] }
 */
export function computePhaseProgress(
  courseMap: CourseSection[] | CourseModule[] | null | undefined,
  completedModuleIds: string[] | null | undefined
): CourseProgressSummary {
  // Handle empty inputs
  if (!courseMap || !Array.isArray(courseMap) || courseMap.length === 0) {
    return {
      totalModules: 0,
      completedModules: 0,
      phases: [],
    };
  }
  
  const completedIdSet = new Set<string>();
  if (completedModuleIds && completedModuleIds.length > 0) {
    // Normalize all IDs to strings
    completedModuleIds.forEach(id => completedIdSet.add(String(id)));
  }
  
  // Check if hierarchical structure
  const isHierarchical = courseMap.length > 0 && 'items' in courseMap[0];
  
  if (isHierarchical) {
    // Hierarchical: process by phase/section
    const phases: PhaseProgress[] = [];
    let totalModules = 0;
    let completedModules = 0;
    
    for (const section of courseMap as CourseSection[]) {
      if (!section.items || !Array.isArray(section.items)) {
        continue;
      }
      
      const total = section.items.length;
      const completed = section.items.filter(item => 
        item && item.id && completedIdSet.has(String(item.id))
      ).length;
      
      // Get remaining (incomplete) items (max 3 for display)
      const remainingItems = section.items.filter(item => 
        item && item.id && !completedIdSet.has(String(item.id))
      );
      const remainingTitles = remainingItems
        .slice(0, 3)
        .map(item => item.title)
        .filter(Boolean);
      
      const isComplete = completed === total && total > 0;
      
      phases.push({
        phaseId: String(section.id),
        phaseTitle: section.title || 'Unnamed Phase',
        total,
        completed,
        isComplete,
        remainingTitles,
      });
      
      totalModules += total;
      completedModules += completed;
    }
    
    return {
      totalModules,
      completedModules,
      phases,
    };
  } else {
    // Flat structure: treat as single "phase"
    const modules = courseMap as CourseModule[];
    const total = modules.length;
    const completed = modules.filter(module => 
      module && module.id && completedIdSet.has(String(module.id))
    ).length;
    
    const remainingItems = modules.filter(module => 
      module && module.id && !completedIdSet.has(String(module.id))
    );
    const remainingTitles = remainingItems
      .slice(0, 3)
      .map(module => module.title)
      .filter(Boolean);
    
    return {
      totalModules: total,
      completedModules: completed,
      phases: [{
        phaseId: 'all',
        phaseTitle: 'All Modules',
        total,
        completed,
        isComplete: completed === total && total > 0,
        remainingTitles,
      }],
    };
  }
}

/**
 * Format phase progress summary as a string for system prompt injection
 * 
 * @param summary - The phase progress summary
 * @returns Formatted string for AI context
 */
export function formatPhaseProgressSummary(summary: CourseProgressSummary): string {
  if (summary.totalModules === 0) {
    return 'No modules in course.';
  }
  
  const allPhasesComplete = summary.phases.every(p => p.isComplete);
  
  let output = `COURSE PROGRESS (PHASE SUMMARY):\n`;
  output += `Overall: ${summary.completedModules}/${summary.totalModules} complete\n\n`;
  
  for (const phase of summary.phases) {
    if (phase.isComplete) {
      output += `${phase.phaseTitle} (${phase.completed}/${phase.total}): ✅ COMPLETE\n`;
    } else {
      output += `${phase.phaseTitle} (${phase.completed}/${phase.total}): IN PROGRESS`;
      
      if (phase.remainingTitles.length > 0) {
        const remainingCount = phase.total - phase.completed;
        const shownCount = Math.min(phase.remainingTitles.length, 3);
        const moreCount = remainingCount - shownCount;
        
        output += `\nRemaining (top ${shownCount}): ${phase.remainingTitles.slice(0, shownCount).join(', ')}`;
        if (moreCount > 0) {
          output += ` (+${moreCount} more)`;
        }
      }
      output += '\n';
    }
  }
  
  if (allPhasesComplete) {
    output += `\n🎉 All phases complete (${summary.phases.length}/${summary.phases.length})`;
  }
  
  return output;
}

