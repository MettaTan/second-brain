/**
 * Dashboard Page
 * Lists all bots owned by the current seller
 */

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { Bot } from '@/lib/types';
import Link from 'next/link';
import { Plus, MessageSquare } from 'lucide-react';
import BotCard from '@/components/dashboard/BotCard';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch bots for this user
  const { data: bots, error } = await supabaseAdmin
    .from('bots')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch bots:', error);
  }

  const botList = (bots as Bot[]) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bots</h1>
          <p className="text-muted-foreground">
            Create and manage your AI-powered course bots
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Create New Bot
        </Link>
      </div>

      {/* Bot Grid */}
      {botList.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No bots yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first bot to start helping students learn
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Bot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {botList.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  );
}
