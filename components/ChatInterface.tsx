/**
 * ChatInterface Component (Multi-Tenant)
 * Chat UI with bot-specific assistant and course map
 */

'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { Send, Loader2, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOrCreateSessionId } from '@/lib/session';
import { cleanText } from '@/lib/utils';
import { Message, CourseModule, CourseSection, CourseItem } from '@/lib/types';
import { toggleModuleCompletion } from '@/app/actions/progress';

interface ChatInterfaceProps {
  botId: string;
  assistantId: string;
  courseMap?: CourseModule[] | CourseSection[];
  studentId?: string; // Guest ID for chat privacy
  completedModuleIds?: string[]; // Client-side progress from CurriculumViewer
}

export default function ChatInterface({
  botId,
  assistantId,
  courseMap = [],
  studentId,
  completedModuleIds: propCompletedModuleIds = [],
}: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isTogglingProgress, setIsTogglingProgress] = useState(false);
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // SOVEREIGN STATE: Manage checkbox state locally when used standalone
  // If parent provides completedModuleIds prop AND studentId, use it (controlled mode)
  // Otherwise, manage state locally (sovereign mode)
  // Note: studentId being passed indicates parent is managing state (e.g., StudentCourseClient)
  const isControlled = studentId !== undefined && propCompletedModuleIds.length >= 0;
  const [localCompletedModuleIds, setLocalCompletedModuleIds] = useState<string[]>([]);
  
  // Load from localStorage when sessionId is available (only in sovereign mode)
  useEffect(() => {
    if (isControlled || !botId || !sessionId) return;
    
    const storageKey = `progress_${botId}_${sessionId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedIds = Array.isArray(parsed) ? parsed : [];
        console.log('📂 ChatInterface: Loaded progress from localStorage (sovereign mode):', { storageKey, count: savedIds.length });
        setLocalCompletedModuleIds(savedIds);
      } catch (error) {
        console.error('Failed to parse localStorage progress:', error);
      }
    }
  }, [botId, sessionId, isControlled]);
  
  // Use prop if controlled, otherwise use local state (sovereign)
  const completedModuleIds = isControlled ? propCompletedModuleIds : localCompletedModuleIds;

  // Check if course map is hierarchical
  const isHierarchical = courseMap && courseMap.length > 0 && 'items' in courseMap[0];

  // Debug: Log course map data
  useEffect(() => {
    console.log('📚 COURSE MAP DATA:', {
      botId,
      courseMapLength: courseMap?.length || 0,
      isHierarchical,
      courseMap: courseMap,
    });
  }, [courseMap, botId, isHierarchical]);

  // Initialize session
  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
  }, []);

  // Load most recent thread for this bot + session on mount
  useEffect(() => {
    if (!sessionId || !botId || threadId) {
      // Skip if no session, no bot, or thread already loaded
      return;
    }

    const loadMostRecentThread = async () => {
      console.log('📜 Loading most recent thread for bot:', botId);
      try {
        const response = await fetch(
          `/api/history?botId=${botId}`,
          {
            headers: {
              'x-session-id': sessionId,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const threads = data.threads || [];
          
          if (threads.length > 0) {
            // Get the most recent thread (first in the list, already sorted by created_at DESC)
            const mostRecentThread = threads[0];
            console.log('✅ Found most recent thread:', mostRecentThread.id);
            setThreadId(mostRecentThread.id);
          } else {
            console.log('ℹ️  No existing threads found, starting fresh');
          }
        }
      } catch (error) {
        console.error('Failed to load most recent thread:', error);
      }
    };

    loadMostRecentThread();
  }, [sessionId, botId, threadId]);

  // Note: Progress is now managed by CurriculumViewer and passed as prop
  // No need to load from database since we're using client-side localStorage

  // Load messages when thread changes
  useEffect(() => {
    if (!threadId || !sessionId) {
      setMessages([]);
      return;
    }

    // 🔒 CRITICAL: Don't reload messages during an active stream!
    // This would wipe out optimistic UI updates (user + bot placeholder)
    if (isLoading) {
      console.log('⏭️ SKIP: Thread changed but stream is active, not reloading messages');
      return;
    }

    const loadMessages = async () => {
      setIsLoadingHistory(true);
      console.log('📥 LOADING: Fetching messages for thread:', threadId);
      try {
        const response = await fetch(
          `/api/messages?threadId=${threadId}${studentId ? `&studentId=${studentId}` : ''}`,
          {
            headers: {
              'x-session-id': sessionId,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📥 LOADED:', data.messages?.length || 0, 'messages from database');
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadMessages();
  }, [threadId, sessionId, isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Toggle section collapse/expand
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

  // Handle module completion toggle
  // SOVEREIGN: Update local state immediately, then save to server
  const handleModuleToggle = async (moduleId: string) => {
    if (!sessionId || isTogglingProgress) return;

    const isCurrentlyCompleted = completedModuleIds.includes(moduleId);
    const newCompletionState = !isCurrentlyCompleted;

    console.log('🎯 Toggling module:', { moduleId, currentState: isCurrentlyCompleted, newState: newCompletionState });

    // CRITICAL: Update local state IMMEDIATELY (optimistic update)
    if (!isControlled) {
      // Sovereign mode: update local state
      setLocalCompletedModuleIds(prev => {
        const newIds = isCurrentlyCompleted 
          ? prev.filter(id => id !== moduleId)
          : [...prev, moduleId];
        
        // Save to localStorage immediately
        if (typeof window !== 'undefined' && botId && sessionId) {
          const storageKey = `progress_${botId}_${sessionId}`;
          localStorage.setItem(storageKey, JSON.stringify(newIds));
          console.log('💾 Saved to localStorage (sovereign mode):', { storageKey, count: newIds.length });
        }
        
        return newIds;
      });
    }
    
    setIsTogglingProgress(true);
    setTogglingModuleId(moduleId);
    
    try {
      const result = await toggleModuleCompletion(botId, sessionId, moduleId, newCompletionState);
      
      if (result.error) {
        console.error('❌ Failed to save progress:', result.error);
        // Revert on error if in sovereign mode
        if (!isControlled) {
          setLocalCompletedModuleIds(prev => {
            const reverted = isCurrentlyCompleted 
              ? [...prev, moduleId]
              : prev.filter(id => id !== moduleId);
            return reverted;
          });
        }
      } else {
        console.log('✅ Progress saved to server');
      }
    } catch (error) {
      console.error('❌ Exception during toggle:', error);
      // Revert on error if in sovereign mode
      if (!isControlled) {
        setLocalCompletedModuleIds(prev => {
          const reverted = isCurrentlyCompleted 
            ? [...prev, moduleId]
            : prev.filter(id => id !== moduleId);
          return reverted;
        });
      }
    } finally {
      setIsTogglingProgress(false);
      setTogglingModuleId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Step 1: Pre-generate IDs BEFORE any async operations
    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;

    // Step 2: Create both messages upfront with pre-generated IDs
    const tempUserMessage: Message = {
      id: userMessageId,
      thread_id: threadId || '',
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    const tempAssistantMessage: Message = {
      id: botMessageId,
      thread_id: threadId || '',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    // Step 3: Add BOTH messages in a single atomic state update
    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setIsLoading(true);

    try {
      // Add timeout for the initial request (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: threadId,
          botId: botId,
          assistantId: assistantId,
          studentId: studentId, // Guest ID for chat privacy
          completedModuleIds: completedModuleIds, // Client-side progress to sync with AI
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log('📡 CLIENT: Starting to read stream...');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      // Step 4: Use LOCAL variable to accumulate content (prevents stale closures)
      let fullContent = '';
      let newThreadId: string | null = threadId;
      let lastChunkTime = Date.now();
      const STREAM_TIMEOUT = 60000; // 60 seconds timeout for stream inactivity
      let streamTimedOut = false;

      // Set up timeout warning (show message after 10 seconds if no content)
      const warningTimeoutId = setTimeout(() => {
        if (fullContent.length === 0 && !streamTimedOut) {
          // Show a helpful message if no content has arrived after 10 seconds
          setMessages((current) => {
            return current.map((msg) => {
              if (msg.id === botMessageId) {
                return { 
                  ...msg, 
                  content: '⏳ Processing your question... This may take a moment with large documents (DOC/DOCX files can take longer to process).' 
                };
              }
              return msg;
            });
          });
        }
      }, 10000);

      // Set up periodic stream health check
      const healthCheckInterval = setInterval(() => {
        if (streamTimedOut) {
          clearInterval(healthCheckInterval);
          return;
        }
        
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        if (timeSinceLastChunk > STREAM_TIMEOUT) {
          console.warn('⚠️ CLIENT: Stream timeout detected - no data for', Math.round(timeSinceLastChunk / 1000), 'seconds');
          streamTimedOut = true;
          clearInterval(healthCheckInterval);
          clearTimeout(warningTimeoutId);
          reader.cancel();
        }
      }, 5000); // Check every 5 seconds

      while (true) {
        // Check for timeout before reading
        if (streamTimedOut) {
          throw new Error('Response timeout: The AI is taking longer than expected. This can happen with large documents (DOC/DOCX files). Please try again.');
        }

        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ CLIENT: Stream complete');
          clearInterval(healthCheckInterval);
          clearTimeout(warningTimeoutId);
          break;
        }

        lastChunkTime = Date.now();
        clearTimeout(warningTimeoutId); // Clear warning once we start receiving data

        const chunk = decoder.decode(value);
        console.log('📦 CLIENT: Received chunk:', chunk.substring(0, 100));
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          console.log('📝 CLIENT: Processing line:', line.substring(0, 50));

          if (line.startsWith('event: thread')) {
            const dataLine = line.split('\n')[1];
            if (dataLine) {
              const data = JSON.parse(dataLine.replace('data: ', ''));
              newThreadId = data.threadId;
              console.log('🆔 CLIENT: Thread ID:', newThreadId);
              if (!threadId && newThreadId) {
                setThreadId(newThreadId);
              }
            }
          } else if (line.startsWith('event: text')) {
            const dataLine = line.split('\n')[1];
            if (dataLine) {
              const data = JSON.parse(dataLine.replace('data: ', ''));
              fullContent += data.text;
              console.log('💬 CLIENT: Accumulated text length:', fullContent.length);

              // Step 5: Update by ID, not by position - eliminates race conditions
              setMessages((current) => {
                console.log('🔍 BEFORE MAP: Looking for botMessageId:', botMessageId, 'in', current.length, 'messages');
                console.log('🔍 BEFORE MAP: Message IDs:', current.map(m => ({ id: m.id, role: m.role, contentLen: m.content.length })));
                
                const updated = current.map((msg) => {
                  if (msg.id === botMessageId) {
                    console.log('✅ MATCH FOUND: Updating message', msg.id, 'with new content length:', fullContent.length);
                    return { ...msg, content: fullContent };
                  }
                  return msg;
                });
                
                console.log('🔍 AFTER MAP: Message IDs:', updated.map(m => ({ id: m.id, role: m.role, contentLen: m.content.length })));
                return updated;
              });
              console.log('🔄 STATE UPDATE: Updated bot message ID:', botMessageId, 'with content length:', fullContent.length);
            }
          } else if (line.startsWith('event: done')) {
            console.log('✅ CLIENT: Received done event');
          } else if (line.startsWith('event: error')) {
            console.error('❌ CLIENT: Received error event:', line);
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Remove the placeholder bot message if it exists
      setMessages((prev) => {
        const filtered = prev.filter(msg => msg.id !== botMessageId);
        
        // Add error message
        const errorMessage: Message = {
          id: Date.now() + 2,
          thread_id: threadId || '',
          role: 'assistant',
          content: error.name === 'AbortError' || error.message?.includes('timeout')
            ? '⏱️ **Request Timeout**\n\nThe AI is taking longer than expected to respond. This can happen with:\n- Large documents (DOC/DOCX files)\n- Complex questions requiring deep analysis\n- High server load\n\n**Please try again** - the request may complete on a retry.'
            : `❌ **Error**\n\n${error.message || 'Sorry, something went wrong. Please try again.'}`,
          created_at: new Date().toISOString(),
        };
        
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                <span className="text-3xl">🧠</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Welcome! I'm your AI course assistant
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask me anything about the course material. I'm here to help you
                learn and understand the content.
              </p>
            </div>
          ) : (
            <>
              {(() => {
                console.log('🎨 RENDER CYCLE: Total messages:', messages.length);
                console.log('🎨 RENDER CYCLE: All messages:', messages.map(m => ({ id: m.id, role: m.role, contentLen: m.content?.length || 0 })));
                return null;
              })()}
              {messages.map((msg, idx) => {
                // Debug logging for assistant messages
                if (msg.role === 'assistant') {
                  console.log(`🎨 RENDER MESSAGE ${idx}: ID=${msg.id}, role=${msg.role}, contentLength=${msg.content?.length || 0}`);
                  console.log(`🎨 RENDER MESSAGE ${idx}: Content preview:`, msg.content?.substring(0, 50) || '(empty)');
                }
                return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {cleanText(msg.content) || ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              )})}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-surface rounded-lg border border-border focus-within:border-primary transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask a question about the course..."
                  className="w-full bg-transparent px-4 py-3 resize-none outline-none max-h-32"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-primary text-primary-foreground p-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Course Map Sidebar */}
      {courseMap && courseMap.length > 0 ? (
        <div className="w-80 border-l border-border bg-surface p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Course Outline</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Track your progress by clicking items as you complete them
          </p>
          
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
                      className="w-full flex items-center justify-between p-2 hover:bg-background rounded-lg transition-colors"
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
                          const isToggling = togglingModuleId === item.id;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleModuleToggle(item.id)}
                              disabled={isToggling}
                              className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-background transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 animate-spin" />
                              ) : isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              )}
                              <span className={`text-xs ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {item.title}
                              </span>
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
                const isToggling = togglingModuleId === module.id;
                
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleToggle(module.id)}
                    disabled={isToggling}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isToggling ? (
                      <Loader2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                <p className="text-xs text-muted-foreground">
                  Progress: {completedModuleIds.length} / {(courseMap as CourseSection[]).reduce((sum, s) => sum + s.items.length, 0)} items
                </p>
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(() => {
                        const total = (courseMap as CourseSection[]).reduce((sum, s) => sum + s.items.length, 0);
                        return total > 0 ? (completedModuleIds.length / total) * 100 : 0;
                      })()}%` 
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Progress: {completedModuleIds.length} / {courseMap.length} modules
                </p>
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${courseMap.length > 0 ? (completedModuleIds.length / courseMap.length) * 100 : 0}%` 
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
