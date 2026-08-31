import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Story } from '@/lib/types';
import { Search, Tag, Play, MapPin, Mic, Calendar, BookOpen, X } from 'lucide-react';

type VaultFeedProps = {
  onSelectStory: (story: Story) => void;
  onUpload: () => void;
};

export function VaultFeed({ onSelectStory, onUpload }: VaultFeedProps) {
  const { profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      if (!profile?.family_id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStories(data as Story[]);
      }
      setLoading(false);
    };
    fetchStories();
  }, [profile?.family_id]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    stories.forEach((s) => {
      s.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesSearch =
        !search ||
        story.title.toLowerCase().includes(search.toLowerCase()) ||
        story.elder_name.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !activeTag || (story.tags?.includes(activeTag) ?? false);
      return matchesSearch && matchesTag;
    });
  }, [stories, search, activeTag]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-ink-400">Loading your family's stories...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 mb-2">
          Your Family's Story Vault
        </h2>
        <p className="text-ink-500">
          {stories.length === 0
            ? 'No stories yet. Be the first to preserve a memory.'
            : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} preserved for future generations.`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or elder's name..."
            className="input-field pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`tag-pill transition-all ${
              !activeTag
                ? 'bg-amber-600 text-white border-amber-600'
                : 'hover:border-amber-400'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`tag-pill transition-all ${
                activeTag === tag
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'hover:border-amber-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Stories grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-parchment-100 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-parchment-400" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-ink-700 mb-2">
            {stories.length === 0 ? 'Your vault is waiting' : 'No stories match your search'}
          </h3>
          <p className="text-ink-400 mb-6">
            {stories.length === 0
              ? 'Preserve an elder\'s story by recording or uploading audio or video.'
              : 'Try a different search term or tag.'}
          </p>
          {stories.length === 0 && (
            <button onClick={onUpload} className="btn-primary">
              Add Your First Story
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} onClick={() => onSelectStory(story)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const hasVideo = !!story.video_url;
  const hasAudio = !!story.audio_url;

  return (
    <button
      onClick={onClick}
      className="card p-6 text-left hover:shadow-xl hover:-translate-y-1 group cursor-pointer animate-fade-in"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-parchment-200 rounded-xl flex items-center justify-center group-hover:from-amber-200 group-hover:to-parchment-300 transition-all">
          {hasVideo ? (
            <Play className="w-5 h-5 text-amber-700" fill="currentColor" />
          ) : (
            <Mic className="w-5 h-5 text-amber-700" />
          )}
        </div>
        <span className="text-xs text-ink-400">
          {new Date(story.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      <h3 className="text-lg font-serif font-semibold text-ink-900 mb-1 line-clamp-2 group-hover:text-amber-700 transition-colors">
        {story.title}
      </h3>
      <p className="text-sm text-ink-500 mb-3">by {story.elder_name}</p>

      {story.summary && (
        <p className="text-sm text-ink-600 line-clamp-2 mb-4">{story.summary}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {story.region && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="w-3 h-3" />
            {story.region}
          </span>
        )}
        {story.language_spoken && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
            <Mic className="w-3 h-3" />
            {story.language_spoken}
          </span>
        )}
        {story.festival_date && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
            <Calendar className="w-3 h-3" />
            {new Date(story.festival_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {story.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill !text-xs !py-0.5">
              {tag}
            </span>
          ))}
          {story.tags.length > 3 && (
            <span className="text-xs text-ink-400">+{story.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
