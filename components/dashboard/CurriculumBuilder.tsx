/**
 * Hierarchical Curriculum Builder with Context Linking
 * Simplified version - click to add (no drag-and-drop dependency)
 */

'use client';

import { useState } from 'react';
import { makeItemId, makeSectionId } from '@/lib/courseIds';
import {
  Plus,
  Trash2,
  FileText,
  Video,
  Link as LinkIcon,
  ClipboardList,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit,
  X,
  MoveRight,
  Upload,
} from 'lucide-react';
import { CourseSection, CourseItem, ItemType } from '@/lib/types';

interface UploadedFile {
  id: string;
  name: string;
}

interface CurriculumBuilderProps {
  uploadedFiles: UploadedFile[];
  curriculum: CourseSection[];
  onChange: (curriculum: CourseSection[]) => void;
  onFileUpload?: (file: File) => Promise<string>; // Returns the new file ID
}

interface ItemModalData {
  sectionId: string;
  item?: CourseItem;
  isOpen: boolean;
}

export default function CurriculumBuilder({
  uploadedFiles,
  curriculum,
  onChange,
  onFileUpload,
}: CurriculumBuilderProps) {
  const [itemModal, setItemModal] = useState<ItemModalData>({
    sectionId: '',
    isOpen: false,
  });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  
  // Form state for item modal
  const [itemForm, setItemForm] = useState({
    title: '',
    type: 'video' as ItemType,
    external_url: '',
    context_file_id: '',
    contextType: 'transcript' as 'transcript' | 'guide', // New: track which option is selected
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Handle file upload from modal
  const handleFileUpload = async (file: File) => {
    if (!onFileUpload) {
      alert('File upload is not available');
      return;
    }

    setIsUploadingFile(true);
    try {
      const newFileId = await onFileUpload(file);
      // Auto-select the newly uploaded file
      setItemForm(prev => ({
        ...prev,
        context_file_id: newFileId,
      }));
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Get unused files
  const getUnusedFiles = () => {
    const usedFileIds = new Set(
      curriculum.flatMap(s =>
        s.items
          .filter(i => i.type === 'file' && i.file_id)
          .map(i => i.file_id!)
      )
    );
    return uploadedFiles.filter(f => !usedFileIds.has(f.id));
  };

  // Add file to section
  const addFileToSection = (fileId: string, sectionId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    // Find the section to get its title for deterministic ID
    const section = curriculum.find(s => s.id === sectionId);
    const sectionTitle = section?.title || 'Unnamed Section';
    const itemTitle = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
    
    const newItem: CourseItem = {
      id: makeItemId(sectionTitle, itemTitle),
      title: itemTitle,
      type: 'file',
      file_id: fileId,
    };

    onChange(
      curriculum.map(s =>
        s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s
      )
    );
  };

  // Bulk move selected files to a phase
  const handleBulkMove = (targetPhaseId: string) => {
    if (selectedFileIds.size === 0) return;

    const targetSection = curriculum.find(s => s.id === targetPhaseId);
    if (!targetSection) return;

    // Create items for all selected files with deterministic IDs
    const section = curriculum.find(s => s.id === targetPhaseId);
    const sectionTitle = section?.title || 'Unnamed Section';
    
    const newItems: CourseItem[] = Array.from(selectedFileIds)
      .map((fileId): CourseItem | null => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (!file) return null;
        const itemTitle = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
        const item: CourseItem = {
          id: makeItemId(sectionTitle, itemTitle),
          title: itemTitle,
          type: 'file' as ItemType,
          file_id: fileId,
        };
        return item;
      })
      .filter((item): item is CourseItem => item !== null);

    // Add all items to the target section
    onChange(
      curriculum.map(s =>
        s.id === targetPhaseId
          ? { ...s, items: [...s.items, ...newItems] }
          : s
      )
    );

    // Clear selection
    setSelectedFileIds(new Set());
  };

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Select all / Deselect all
  const toggleSelectAll = () => {
    const unusedFiles = getUnusedFiles();
    if (selectedFileIds.size === unusedFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(unusedFiles.map(f => f.id)));
    }
  };

  // Add section
  const addSection = () => {
    const sectionTitle = `Phase ${curriculum.length + 1}`;
    const newSection: CourseSection = {
      id: makeSectionId(sectionTitle),
      title: sectionTitle,
      items: [],
    };
    onChange([...curriculum, newSection]);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    onChange(curriculum.filter(s => s.id !== sectionId));
  };

  // Update section title
  // NOTE: We do NOT regenerate the ID when title changes to keep IDs stable
  // This preserves progress tracking - IDs are generated once at creation
  const updateSectionTitle = (sectionId: string, title: string) => {
    onChange(
      curriculum.map(s => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  // Toggle section collapse
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

  // Helper: Check if filename is a transcript
  const isTranscriptFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return lower.includes('transcript') || 
           lower.includes('srt') || 
           lower.includes('vtt') || 
           lower.includes('caption') ||
           lower.endsWith('.txt') ||
           lower.endsWith('.srt') ||
           lower.endsWith('.vtt');
  };

  // Open item modal
  const openItemModal = (sectionId: string, item?: CourseItem) => {
    if (item) {
      // Detect if existing context file is a transcript
      let contextType: 'transcript' | 'guide' = 'guide';
      if (item.context_file_id) {
        const contextFile = uploadedFiles.find(f => f.id === item.context_file_id);
        if (contextFile && isTranscriptFile(contextFile.name)) {
          contextType = 'transcript';
        }
      }
      
      setItemForm({
        title: item.title,
        type: item.type,
        external_url: item.external_url || '',
        context_file_id: item.context_file_id || '',
        contextType,
      });
    } else {
      setItemForm({
        title: '',
        type: 'video',
        external_url: '',
        context_file_id: '',
        contextType: 'transcript', // Default to transcript (recommended)
      });
    }
    setItemModal({ sectionId, item, isOpen: true });
  };

  // Save item from modal
  const saveItem = () => {
    const { sectionId, item } = itemModal;
    
    if (!itemForm.title.trim()) {
      alert('Title is required');
      return;
    }

    // Use existing ID if editing, otherwise generate deterministic ID
    const section = curriculum.find(s => s.id === sectionId);
    const sectionTitle = section?.title || 'Unnamed Section';
    
    const itemData: CourseItem = {
      id: item?.id || makeItemId(sectionTitle, itemForm.title),
      title: itemForm.title,
      type: itemForm.type,
      external_url: itemForm.external_url || undefined,
      context_file_id: itemForm.context_file_id || undefined,
    };

    onChange(
      curriculum.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: item
                ? s.items.map(i => (i.id === item.id ? itemData : i))
                : [...s.items, itemData],
            }
          : s
      )
    );

    setItemModal({ sectionId: '', isOpen: false });
  };

  // Remove item
  const removeItem = (sectionId: string, itemId: string) => {
    onChange(
      curriculum.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.filter(i => i.id !== itemId) }
          : s
      )
    );
  };

  const unusedFiles = getUnusedFiles();

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Zone A: Unassigned Assets (Left Sidebar) */}
      <div className="w-64 flex-shrink-0 border border-border rounded-lg bg-background p-4 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Unassigned Files
          </h3>
          {unusedFiles.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs text-primary hover:underline"
            >
              {selectedFileIds.size === unusedFiles.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedFileIds.size > 0 && (
          <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs font-medium mb-2">
              {selectedFileIds.size} file{selectedFileIds.size !== 1 ? 's' : ''} selected
            </p>
            {curriculum.length > 0 ? (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkMove(e.target.value);
                  }
                }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
                defaultValue=""
              >
                <option value="">Add to Phase...</option>
                {curriculum.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-muted-foreground">
                Create a phase first
              </p>
            )}
          </div>
        )}
        
        {unusedFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            All files have been organized! 🎉
          </p>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto">
            {unusedFiles.map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                sections={curriculum}
                onAddToSection={addFileToSection}
                isSelected={selectedFileIds.has(file.id)}
                onToggleSelection={() => toggleFileSelection(file.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Click + to add files to phases
          </p>
        </div>
      </div>

      {/* Zone B: Curriculum Canvas (Main Area) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Curriculum Structure</h3>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Phase
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {curriculum.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-lg p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No Phases Yet</h4>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Create your first phase to start organizing your curriculum
              </p>
              <button
                type="button"
                onClick={addSection}
                className="text-primary hover:underline text-sm font-medium"
              >
                Create Your First Phase
              </button>
            </div>
          ) : (
            curriculum.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                isCollapsed={collapsedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                onUpdateTitle={(title) => updateSectionTitle(section.id, title)}
                onRemove={() => removeSection(section.id)}
                onAddItem={() => openItemModal(section.id)}
                onEditItem={(item) => openItemModal(section.id, item)}
                onRemoveItem={(itemId) => removeItem(section.id, itemId)}
                uploadedFiles={uploadedFiles}
                onBulkAdd={() => handleBulkMove(section.id)}
                hasSelectedFiles={selectedFileIds.size > 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Item Modal */}
      {itemModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {itemModal.item ? 'Edit Item' : 'Add External Item'}
              </h3>
              <button
                onClick={() => setItemModal({ sectionId: '', isOpen: false })}
                className="p-1 hover:bg-surface rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="e.g., Module 1 Video"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={itemForm.type}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, type: e.target.value as ItemType })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                  <option value="link">Resource Link</option>
                </select>
              </div>

              {/* External URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  value={itemForm.external_url}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, external_url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="https://skool.com/..."
                />
              </div>

              {/* AI Context Source - Only show for video/quiz/link types */}
              {(itemForm.type === 'video' || itemForm.type === 'quiz' || itemForm.type === 'link') && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    AI Context Source
                  </label>

                  {/* Radio Option 1: Transcript (Recommended) */}
                  <div className="border border-border rounded-lg p-4 bg-surface/50">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="context-transcript"
                        name="contextType"
                        checked={itemForm.contextType === 'transcript'}
                        onChange={() => {
                          // Preserve context_file_id if it's a transcript file, otherwise clear it
                          const currentFile = uploadedFiles.find(f => f.id === itemForm.context_file_id);
                          const shouldPreserve = currentFile && isTranscriptFile(currentFile.name);
                          setItemForm({ 
                            ...itemForm, 
                            contextType: 'transcript',
                            context_file_id: shouldPreserve ? itemForm.context_file_id : ''
                          });
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="context-transcript" className="block text-sm font-semibold mb-1 cursor-pointer">
                          📄 Link Transcript (Recommended)
                        </label>
                        <p className="text-xs text-muted-foreground mb-3">
                          The AI reads this to 'watch' the video. Uploading a .txt or .srt file here gives the most accurate answers.
                        </p>
                        {itemForm.contextType === 'transcript' && (
                          <div className="space-y-2">
                            <select
                              value={itemForm.context_file_id}
                              onChange={(e) =>
                                setItemForm({ ...itemForm, context_file_id: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
                            >
                              <option value="">Select a transcript file...</option>
                              {uploadedFiles
                                .filter(file => isTranscriptFile(file.name))
                                .map(file => (
                                  <option key={file.id} value={file.id}>
                                    {file.name}
                                  </option>
                                ))}
                              {uploadedFiles.filter(file => !isTranscriptFile(file.name)).length > 0 && (
                                <optgroup label="Other files">
                                  {uploadedFiles
                                    .filter(file => !isTranscriptFile(file.name))
                                    .map(file => (
                                      <option key={file.id} value={file.id}>
                                        {file.name}
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                            </select>
                            
                            {/* Just-in-Time Upload */}
                            {onFileUpload && (
                              <div className="pt-2 border-t border-border">
                                <label className="block text-xs font-medium text-muted-foreground mb-2">
                                  Or upload a new transcript file:
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer text-sm">
                                  <Upload className="w-4 h-4 text-primary" />
                                  <span className="text-xs">
                                    {isUploadingFile ? 'Uploading...' : 'Choose file (.txt, .pdf, .srt)'}
                                  </span>
                                  <input
                                    type="file"
                                    accept=".txt,.pdf,.docx,.srt,.vtt"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file);
                                      }
                                      e.target.value = ''; // Reset input
                                    }}
                                    className="hidden"
                                    disabled={isUploadingFile}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Radio Option 2: General Guide (Fallback) */}
                  <div className="border border-border rounded-lg p-4 bg-surface/50">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="context-guide"
                        name="contextType"
                        checked={itemForm.contextType === 'guide'}
                        onChange={() => {
                          // Preserve context_file_id if it's NOT a transcript file, otherwise clear it
                          const currentFile = uploadedFiles.find(f => f.id === itemForm.context_file_id);
                          const shouldPreserve = currentFile && !isTranscriptFile(currentFile.name);
                          setItemForm({ 
                            ...itemForm, 
                            contextType: 'guide',
                            context_file_id: shouldPreserve ? itemForm.context_file_id : ''
                          });
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="context-guide" className="block text-sm font-semibold mb-1 cursor-pointer">
                          📚 Link General Guide
                        </label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Use a module workbook or slide deck. The AI will understand concepts but may miss specific spoken details.
                        </p>
                        {itemForm.contextType === 'guide' && (
                          <div className="space-y-2">
                            <select
                              value={itemForm.context_file_id}
                              onChange={(e) =>
                                setItemForm({ ...itemForm, context_file_id: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
                            >
                              <option value="">Select a guide file...</option>
                              {uploadedFiles.map(file => (
                                <option key={file.id} value={file.id}>
                                  {file.name}
                                </option>
                              ))}
                            </select>
                            
                            {/* Just-in-Time Upload */}
                            {onFileUpload && (
                              <div className="pt-2 border-t border-border">
                                <label className="block text-xs font-medium text-muted-foreground mb-2">
                                  Or upload a new guide file:
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer text-sm">
                                  <Upload className="w-4 h-4 text-primary" />
                                  <span className="text-xs">
                                    {isUploadingFile ? 'Uploading...' : 'Choose file (.pdf, .docx, .txt)'}
                                  </span>
                                  <input
                                    type="file"
                                    accept=".pdf,.docx,.doc,.txt"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file);
                                      }
                                      e.target.value = ''; // Reset input
                                    }}
                                    className="hidden"
                                    disabled={isUploadingFile}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning - Only show for external items without context */}
              {!itemForm.context_file_id && (itemForm.type === 'video' || itemForm.type === 'quiz' || itemForm.type === 'link') && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    <strong>⚠️ AI Blind:</strong> Without a context file, the AI won't be able to answer questions about this item. Please link a transcript or guide above.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setItemModal({ sectionId: '', isOpen: false })}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveItem}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                {itemModal.item ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// File Card with checkbox and dropdown
function FileCard({ 
  file, 
  sections,
  onAddToSection,
  isSelected,
  onToggleSelection,
}: { 
  file: UploadedFile;
  sections: CourseSection[];
  onAddToSection: (fileId: string, sectionId: string) => void;
  isSelected: boolean;
  onToggleSelection: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAddToSection = (sectionId: string) => {
    onAddToSection(file.id, sectionId);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 p-2 bg-surface border rounded-lg ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
          onClick={(e) => e.stopPropagation()}
        />
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-xs truncate flex-1">{file.name}</span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 hover:bg-background rounded text-xs text-primary"
          title="Add to phase"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      
      {showDropdown && sections.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <div className="p-1">
            <div className="text-xs font-medium px-2 py-1 text-muted-foreground">
              Add to Phase:
            </div>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => handleAddToSection(section.id)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-surface rounded flex items-center gap-2"
              >
                <MoveRight className="w-3 h-3" />
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Section Card
function SectionCard({
  section,
  isCollapsed,
  onToggle,
  onUpdateTitle,
  onRemove,
  onAddItem,
  onEditItem,
  onRemoveItem,
  uploadedFiles,
  onBulkAdd,
  hasSelectedFiles,
}: {
  section: CourseSection;
  isCollapsed: boolean;
  onToggle: () => void;
  onUpdateTitle: (title: string) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onEditItem: (item: CourseItem) => void;
  onRemoveItem: (itemId: string) => void;
  uploadedFiles: UploadedFile[];
  onBulkAdd: () => void;
  hasSelectedFiles: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-background rounded"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-base font-semibold bg-transparent border-none outline-none focus:bg-background px-2 py-1 rounded flex-1"
            placeholder="Phase Title..."
          />
          <span className="text-xs text-muted-foreground">
            ({section.items.length} items)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasSelectedFiles && (
            <button
              onClick={onBulkAdd}
              className="p-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
              title="Add selected files to this phase"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Items */}
      {!isCollapsed && (
        <>
          <div className="space-y-2 mb-3 min-h-[100px] border-2 border-dashed border-border rounded-lg p-3">
            {section.items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No items yet - add files or external content
              </p>
            ) : (
              section.items.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  uploadedFiles={uploadedFiles}
                  onEdit={() => onEditItem(item)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))
            )}
          </div>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-lg hover:border-primary hover:bg-background transition-colors text-sm text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
            Add Video / Quiz / Link
          </button>
        </>
      )}
    </div>
  );
}

// Item Card
function ItemCard({
  item,
  uploadedFiles,
  onEdit,
  onRemove,
}: {
  item: CourseItem;
  uploadedFiles: UploadedFile[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'quiz':
        return <ClipboardList className="w-4 h-4 text-green-500" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-orange-500" />;
    }
  };

  // Helper: Check if filename is a transcript
  const isTranscriptFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return lower.includes('transcript') || 
           lower.includes('srt') || 
           lower.includes('vtt') || 
           lower.includes('caption') ||
           lower.endsWith('.txt') ||
           lower.endsWith('.srt') ||
           lower.endsWith('.vtt');
  };

  const contextFile = item.context_file_id
    ? uploadedFiles.find(f => f.id === item.context_file_id)
    : null;

  const needsContext = item.type !== 'file' && !item.context_file_id;
  
  // Determine badge type based on context file
  const getContextBadge = () => {
    if (needsContext) {
      // No context file linked
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 rounded text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          <span>🛑 AI Blind</span>
        </div>
      );
    }
    
    if (contextFile) {
      if (isTranscriptFile(contextFile.name)) {
        // Transcript linked
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded text-xs text-green-600 dark:text-green-400">
            <Brain className="w-3 h-3" />
            <span>✅ Transcript Linked</span>
          </div>
        );
      } else {
        // Guide linked
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded text-xs text-yellow-600 dark:text-yellow-400">
            <Brain className="w-3 h-3" />
            <span>⚠️ Guide Linked</span>
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 group">
      {getItemIcon(item.type)}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{item.title}</span>
          {getContextBadge()}
        </div>
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate block"
          >
            {item.external_url}
          </a>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.type !== 'file' && (
          <button
            onClick={onEdit}
            className="p-1 hover:bg-surface rounded"
          >
            <Edit className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1 hover:bg-surface rounded"
        >
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
