/**
 * Create Bot Wizard
 * Form for sellers to create a new bot
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, Upload, CheckCircle } from 'lucide-react';
import { createBotAction } from './actions';
import CurriculumBuilder from '@/components/dashboard/CurriculumBuilder';
import { CourseSection } from '@/lib/types';

// Default "Creator Cortex Implementation Coach" prompt for all new bots
const DEFAULT_SYSTEM_PROMPT = `You are the "Creator Cortex Implementation Coach." Your goal is to help students finish the course, not just chat.

[CONTEXT: USER PROGRESS]
The user has currently completed: {{COMPLETED_MODULES_LIST}}

[CORE BEHAVIORS]
1. **The "Next Step" Rule:**
   - If the user asks "What should I do next?", look at their completed list.
   - Find the LAST item they finished, and recommend the IMMEDIATE next module in the sequence.
   - If the list is "No modules completed yet", enthusiastically recommend starting with Module 1.

2. **The "Evidence-Based" Rule:**
   - Never assume the user has done a task unless it appears in the list above.
   - If they ask about an advanced topic (e.g., "Value Ladders") but haven't checked off the "Fundamentals" module, politely warn them: "I can explain that, but I noticed you haven't checked off the Fundamentals module yet. It might be helpful to review that first."

[CONTENT HANDLING]
1. **Templates:** The source text contains placeholders like "[Topic]" or "[Niche]". DO NOT read these out loud. Treat them as variables that the student needs to fill in.
2. **Tone:** Professional, encouraging, but concise. Do not give long lectures. Give actionable advice.`;

type WizardStep = 'details' | 'curriculum';

export default function CreateBotPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'uploading' | 'configuring' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form state
  const [botName, setBotName] = useState('');
  const [systemInstructions, setSystemInstructions] = useState(DEFAULT_SYSTEM_PROMPT);
  const [files, setFiles] = useState<File[]>([]);
  const [curriculum, setCurriculum] = useState<CourseSection[]>([]);

  // Handle just-in-time file upload from curriculum builder
  const handleDirectUpload = async (newFile: File): Promise<string> => {
    // Calculate the new file's index (current length = new index)
    const newIndex = files.length;
    const fileId = `file_${newIndex}_${newFile.name}`;
    
    // Add file to the files array
    setFiles(prev => [...prev, newFile]);
    
    // Return the ID so the modal can auto-select it
    return fileId;
  };

  // Step 1: Validate and move to curriculum builder
  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!botName.trim()) {
      setError('Bot name is required');
      return;
    }
    
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }
    
    console.log('✅ Step 1 validated, moving to curriculum builder');
    setError(null);
    setCurrentStep('curriculum');
  };

  // Step 2: Submit final bot creation
  const handleFinalSubmit = async () => {
    console.log('🎬 CLIENT: Final form submitted');
    console.log('   - Bot Name:', botName);
    console.log('   - Instructions:', systemInstructions?.substring(0, 50) + '...');
    console.log('   - Files:', files.length);
    console.log('   - Curriculum sections:', curriculum.length);
    
    setIsLoading(true);
    setLoadingStatus('uploading');
    setError(null);

    try {
      console.log('📦 CLIENT: Creating FormData...');
      const formData = new FormData();
      formData.append('botName', botName);
      formData.append('systemInstructions', systemInstructions);
      formData.append('curriculum', JSON.stringify(curriculum));
      
      files.forEach((file, index) => {
        console.log(`   - Adding file ${index + 1}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        formData.append('files', file);
      });

      console.log('🚀 CLIENT: Calling createBotAction...');
      
      // Simulate upload phase (files are being uploaded in the action)
      setTimeout(() => {
        if (loadingStatus === 'uploading') {
          setLoadingStatus('configuring');
        }
      }, 2000); // Switch to "configuring" after 2 seconds
      
      const result = await createBotAction(formData);
      console.log('📥 CLIENT: Received result:', result);

      if (result.error) {
        console.error('❌ CLIENT: Error received:', result.error);
        setError(result.error);
        setIsLoading(false);
        setLoadingStatus(null);
      } else {
        console.log('✅ CLIENT: Success! Bot ID:', result.botId);
        
        // Show success toast
        setShowSuccessToast(true);
        
        // Redirect after a brief moment to show the toast
        setTimeout(() => {
          console.log('   Redirecting to dashboard...');
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error('❌ CLIENT: Exception caught:', err);
      console.error('   Message:', err.message);
      console.error('   Stack:', err.stack);
      setError(err.message || 'Failed to create bot');
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Create New Bot</h1>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`px-3 py-1 rounded-full ${currentStep === 'details' ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground'}`}>
              Step 1
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`px-3 py-1 rounded-full ${currentStep === 'curriculum' ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground'}`}>
              Step 2
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          {currentStep === 'details' 
            ? 'Set up an AI assistant powered by your course content'
            : 'Organize your content into a structured curriculum'
          }
        </p>
      </div>

      {/* Step 1: Bot Details */}
      {currentStep === 'details' && (
        <form onSubmit={handleNextStep} className="space-y-6">
        {/* Bot Name */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <label htmlFor="botName" className="block text-lg font-semibold mb-2">
            Bot Name
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            Give your bot a memorable name (e.g., "Marketing 101 Coach")
          </p>
          <input
            id="botName"
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter bot name..."
            disabled={isLoading}
          />
        </div>

        {/* System Instructions */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <label
            htmlFor="systemInstructions"
            className="block text-lg font-semibold mb-2"
          >
            System Instructions
            <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded">
              Pre-filled with Anti-Robot prompt
            </span>
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            Define how your bot should behave and respond to students. The default prompt prevents template placeholders from showing.
          </p>
          <textarea
            id="systemInstructions"
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-y font-mono text-sm"
            disabled={isLoading}
          />
        </div>

        {/* File Upload */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <label className="block text-lg font-semibold mb-2">
            Course Content
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            Upload documents containing your course material (PDF, DOC, DOCX, TXT). The AI will
            use these to answer student questions.
          </p>

          {files.length === 0 ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, TXT files (Max 20MB each, multiple files supported)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files || []);
                  setFiles(selectedFiles);
                }}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-background border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-sm">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="p-1.5 hover:bg-surface rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Add more files
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setFiles((prev) => [...prev, ...newFiles]);
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1 Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!botName || files.length === 0}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center gap-2"
          >
            Next: Organize Curriculum
            <span className="ml-1">→</span>
          </button>
        </div>
      </form>
      )}

      {/* Step 2: Curriculum Builder */}
      {currentStep === 'curriculum' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <CurriculumBuilder
              uploadedFiles={files.map((file, index) => ({
                id: `file_${index}_${file.name}`,
                name: file.name,
              }))}
              curriculum={curriculum}
              onChange={setCurriculum}
              onFileUpload={handleDirectUpload}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('details')}
              className="px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors font-medium"
              disabled={isLoading}
            >
              ← Back to Details
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading 
                ? loadingStatus === 'uploading' 
                  ? 'Uploading knowledge base...'
                  : 'Configuring Assistant...'
                : 'Finalize & Create Bot'
              }
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="font-semibold mb-2">💡 What happens next?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">1.</span>
            <span>
              Your documents will be uploaded to OpenAI's Vector Store for semantic
              search
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">2.</span>
            <span>
              An AI Assistant will be created with file_search capabilities
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">3.</span>
            <span>A course map will be auto-generated from your content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">4.</span>
            <span>
              You'll get a shareable link for students to access the bot
            </span>
          </li>
        </ul>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Bot Created Successfully!</p>
            <p className="text-sm text-green-100">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
