# Hierarchical Curriculum Builder

## Overview
The platform now supports a hierarchical curriculum structure with phases/sections containing multiple items (files, videos, quizzes, links).

## Data Structure

### New Types
```typescript
type ItemType = 'file' | 'video' | 'quiz' | 'link';

interface CourseItem {
  id: string;              // UUID
  title: string;           // "1.1 Welcome Video"
  type: ItemType;
  file_id?: string;        // OpenAI file ID (for 'file' type)
  external_url?: string;   // URL (for 'video', 'link' types)
}

interface CourseSection {
  id: string;              // UUID
  title: string;           // "Phase 1: Foundations"
  items: CourseItem[];
}

type CourseMap = CourseSection[];
```

### Backwards Compatibility
The system supports both:
- **Legacy:** Flat array of `CourseModule[]`
- **New:** Hierarchical `CourseSection[]`

## Features

### 1. Curriculum Builder (`components/CurriculumBuilder.tsx`)
**Location:** Bot creation wizard

**Features:**
- ✅ Create/remove/rename phases
- ✅ Add items: uploaded files, video links, quizzes, resource links
- ✅ Unused files pool shows unorganized content
- ✅ Visual drag handles (ready for drag-and-drop)
- ✅ Real-time summary (phases + items count)

**User Flow:**
1. Upload files → Files appear in "Uploaded Files" pool
2. Click "Add Phase" → Create sections
3. Organize files into phases using dropdown
4. Add non-file items (videos, quizzes, links)
5. Submit → Curriculum saved to database

### 2. Hierarchical Sidebar (`components/ChatInterface.tsx`)
**Location:** Student chat interface

**Features:**
- ✅ Collapsible sections with chevron icons
- ✅ Section progress counter (X/Y items)
- ✅ Nested item list with indentation
- ✅ Click to mark items complete
- ✅ Real-time progress bar
- ✅ Backwards compatible with flat structure

**Visual Structure:**
```
Course Outline
└─ ▼ Phase 1: Foundations (2/3)
   ├─ ✓ 1.1 Welcome Video
   ├─ ○ 1.2 Introduction PDF
   └─ ○ 1.3 Quiz: Basics
└─ ▶ Phase 2: Strategy (0/5)
```

### 3. Progress Tracking
**Database:** `student_progress.completed_module_ids` stores item IDs

**Features:**
- ✅ Works with both flat and hierarchical structures
- ✅ Optimistic UI updates
- ✅ Persists across page refreshes
- ✅ AI receives accurate progress context

### 4. AI Context Injection
**Location:** `app/api/chat/route.ts`

**Logic:**
1. Fetch student progress (item IDs)
2. Resolve IDs to titles (searches sections if hierarchical)
3. Replace `{{COMPLETED_MODULES_LIST}}` in system prompt
4. AI receives: "Introduction, Welcome Video, Quiz 1"

## Database Schema

### Existing Tables (No Changes Required)
```sql
-- Bots table
course_map JSONB -- Now supports both structures

-- Student Progress table
completed_module_ids JSONB -- Stores item IDs regardless of structure
```

## Migration Path

### For Existing Bots
Old bots with flat structure continue to work:
```json
[
  { "id": "m1", "title": "Introduction" },
  { "id": "m2", "title": "Module 2" }
]
```

### For New Bots
New hierarchical structure:
```json
[
  {
    "id": "section_123",
    "title": "Phase 1",
    "items": [
      {
        "id": "item_456",
        "title": "1.1 Welcome",
        "type": "video",
        "external_url": "https://..."
      },
      {
        "id": "item_457",
        "title": "1.2 PDF",
        "type": "file",
        "file_id": "file-abc123"
      }
    ]
  }
]
```

## Usage Examples

### Creator: Build Curriculum
1. Navigate to `/dashboard/new`
2. Upload 20 PDF files
3. Click "Add Phase" → Create "Phase 1: Foundations"
4. Select files from dropdown → Add to phase
5. Click "+ Video Link" → Add external content
6. Repeat for all phases
7. Submit → Bot created with hierarchical curriculum

### Student: Track Progress
1. Open bot chat at `/c/[botId]`
2. See collapsible phases in sidebar
3. Click chevron to expand/collapse phases
4. Click circle next to item → Marks complete
5. Progress bar updates in real-time
6. Ask bot: "What's my progress?" → Gets accurate list

### AI: Provide Context-Aware Responses
**System Prompt Template:**
```
The user has completed: {{COMPLETED_MODULES_LIST}}
```

**Runtime (Student completed 2 items):**
```
The user has completed: Welcome Video, Introduction PDF
```

**AI Response:**
- ✅ Knows exactly what student finished
- ✅ Doesn't hallucinate progress
- ✅ Suggests next logical step

## Implementation Details

### File ID Mapping
During bot creation:
1. Files uploaded → Temp IDs (`file_0_name.pdf`)
2. Curriculum builder uses temp IDs
3. Files uploaded to OpenAI → Real IDs (`file-abc123`)
4. Temp IDs replaced with real IDs before saving

### Section Collapse State
- Stored in local component state
- Not persisted (resets on refresh)
- Default: all sections expanded

### Progress Calculation
```typescript
// Hierarchical
const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
const progress = (completedItems / totalItems) * 100;

// Flat
const progress = (completedModules / modules.length) * 100;
```

## API Changes

### Create Bot Action
**New Input:** `curriculum` (JSON string)

**Processing:**
1. Parse curriculum JSON
2. Upload files → Get OpenAI IDs
3. Map temp file IDs → real file IDs
4. Save updated curriculum to database

### Chat API
**Enhanced Logic:**
1. Detect if `course_map` is hierarchical
2. Search items within sections (if hierarchical)
3. Build completed titles list
4. Inject into AI context

## Testing Checklist

### ✅ Curriculum Builder
- [ ] Can create multiple phases
- [ ] Can add files to phases
- [ ] Can add videos/quizzes/links
- [ ] Unused files pool updates correctly
- [ ] Can remove items and sections

### ✅ Sidebar Display
- [ ] Hierarchical structure renders correctly
- [ ] Sections can be collapsed/expanded
- [ ] Progress counters accurate
- [ ] Checkboxes work for all items
- [ ] Progress bar calculates correctly

### ✅ Progress Tracking
- [ ] Clicking items saves to database
- [ ] Refreshing page persists progress
- [ ] Multiple students can have different progress
- [ ] Works with both flat and hierarchical

### ✅ AI Context
- [ ] AI receives correct completed items
- [ ] Works with hierarchical structure
- [ ] Works with flat structure (backwards compat)
- [ ] "What's my progress?" returns accurate list

## Future Enhancements

### Potential Features
1. **Drag-and-Drop:** Reorder items and sections
2. **Item Types:** Add more types (assignment, discussion, etc.)
3. **Prerequisites:** Lock items until prerequisites complete
4. **Section Settings:** Due dates, descriptions, thumbnails
5. **Bulk Actions:** Move multiple items at once
6. **Templates:** Pre-built curriculum structures
7. **Import/Export:** Share curriculum between bots

### Performance Optimizations
1. Virtualized lists for large curricula (100+ items)
2. Lazy loading of collapsed sections
3. Memoization of progress calculations
4. Debounced curriculum saves during editing

## Conclusion

The hierarchical curriculum builder provides a flexible, scalable way to organize course content while maintaining backwards compatibility with existing flat structures. The implementation prioritizes user experience with optimistic updates, real-time feedback, and accurate progress tracking.




