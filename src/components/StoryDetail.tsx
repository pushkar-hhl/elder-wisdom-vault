import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Story } from '@/lib/types';
import {
  ArrowLeft,
  MapPin,
  Mic,
  Calendar,
  Tag,
  User,
  FileText,
  Languages,
  Loader2,
} from 'lucide-react';

type StoryDetailProps = {
  story: Story;
  onBack: () => void;
};

export function StoryDetail({ story, onBack }: StoryDetailProps) {
  const [fullStory, setFullStory] = useState<Story>(story);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchFull = async () => {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', story.id)
        .maybeSingle();
      if (data) setFullStory(data as Story);
    };
    if (story.id) fetchFull();
  }, [story.id]);

  const handleProcess = async () => {
    setProcessing(true);
    setProcessMsg(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ storyId: fullStory.id }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const result = await response.json();
      setProcessMsg(result.message || 'Processing complete.');

      // Refresh story data
      setLoading(true);
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', fullStory.id)
        .maybeSingle();
      if (data) setFullStory(data as Story);
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Processing failed.';
      setProcessMsg(`Error: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const hasAudio = !!fullStory.audio_url;
  const hasVideo = !!fullStory.video_url;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-slide-up">
      <button
        onClick={onBack}
        className="btn-ghost flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vault
      </button>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </div>
      )}

      {/* Title section */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 mb-2">
          {fullStory.title}
        </h1>
        <div className="flex items-center gap-2 text-ink-500">
          <User className="w-4 h-4" />
          <span>{fullStory.elder_name}</span>
        </div>
      </div>

      {/* Media player */}
      <div className="card p-4 sm:p-6 mb-6">
        {hasVideo && (
          <video
            src={fullStory.video_url!}
            controls
            className="w-full rounded-xl bg-ink-900"
          />
        )}
        {hasAudio && !hasVideo && (
          <div className="bg-parchment-100 rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <audio src={fullStory.audio_url!} controls className="w-full" />
          </div>
        )}
        {!hasAudio && !hasVideo && (
          <div className="text-center py-8 text-ink-400">
            No media attached to this story.
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {fullStory.region && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide">Region</p>
              <p className="text-sm font-medium text-ink-800">{fullStory.region}</p>
            </div>
          </div>
        )}
        {fullStory.language_spoken && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide">Language</p>
              <p className="text-sm font-medium text-ink-800">{fullStory.language_spoken}</p>
            </div>
          </div>
        )}
        {fullStory.festival_date && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-clay-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-clay-600" />
            </div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide">Festival Date</p>
              <p className="text-sm font-medium text-ink-800">
                {new Date(fullStory.festival_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-parchment-200 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-ink-600" />
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Recorded On</p>
            <p className="text-sm font-medium text-ink-800">
              {new Date(fullStory.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {fullStory.tags && fullStory.tags.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-ink-500" />
            <span className="text-sm font-semibold text-ink-700">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {fullStory.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {fullStory.summary && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-serif font-semibold text-ink-900 mb-2">Summary</h3>
          <p className="text-ink-600 leading-relaxed">{fullStory.summary}</p>
        </div>
      )}

      {/* Transcript */}
      {fullStory.transcript && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-ink-600" />
            <h3 className="text-lg font-serif font-semibold text-ink-900">Transcript</h3>
          </div>
          <p className="text-ink-600 leading-relaxed whitespace-pre-wrap">
            {fullStory.transcript}
          </p>
        </div>
      )}

      {/* Translation */}
      {fullStory.translation && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-5 h-5 text-ink-600" />
            <h3 className="text-lg font-serif font-semibold text-ink-900">Translation</h3>
          </div>
          <p className="text-ink-600 leading-relaxed whitespace-pre-wrap">
            {fullStory.translation}
          </p>
        </div>
      )}

      {/* Process story stub */}
      <div className="card p-6 border-dashed border-2 border-parchment-300">
        <h3 className="text-lg font-serif font-semibold text-ink-900 mb-1">
          AI Processing
        </h3>
        <p className="text-sm text-ink-500 mb-4">
          Generate transcript, translation, and summary for this story. (Stub endpoint — AI logic to be added later.)
        </p>
        <button
          onClick={handleProcess}
          disabled={processing}
          className="btn-secondary flex items-center gap-2"
        >
          {processing && <Loader2 className="w-4 h-4 animate-spin" />}
          {processing ? 'Processing...' : 'Process Story'}
        </button>
        {processMsg && (
          <div className="mt-3 text-sm text-ink-600 bg-parchment-50 px-4 py-2 rounded-lg">
            {processMsg}
          </div>
        )}
      </div>
    </div>
  );
}
