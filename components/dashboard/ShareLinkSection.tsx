/**
 * ShareLinkSection Component
 * Copy and preview share link for student access
 */

'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface ShareLinkSectionProps {
  botId: string;
}

export default function ShareLinkSection({ botId }: ShareLinkSectionProps) {
  const [copied, setCopied] = useState(false);
  
  // Get the full URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/course/${botId}`
    : `/course/${botId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Revert after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePreview = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-4 pt-4 border-t border-border bg-background/50 rounded-lg p-4">
      <div className="mb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-1">
          Student Access
        </p>
        <p className="text-xs text-muted-foreground">
          Share this link with your students
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* URL Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono pr-20 focus:outline-none focus:border-primary transition-colors"
            onClick={(e) => {
              // Select all text on click for easy manual copy
              (e.target as HTMLInputElement).select();
            }}
          />
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all ${
            copied
              ? 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400'
              : 'bg-surface border-border hover:border-primary text-foreground'
          }`}
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? (
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">Copied!</span>
            </div>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Preview Button */}
        <button
          onClick={handlePreview}
          className="flex-shrink-0 px-3 py-2 rounded-lg border border-border bg-surface hover:border-primary text-foreground transition-colors"
          title="Preview student view"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}




