import { useAuth } from '@/lib/auth';
import { BookOpen, LogOut, Plus, Home } from 'lucide-react';

type HeaderProps = {
  view: 'feed' | 'upload' | 'detail';
  onNavigate: (view: 'feed' | 'upload') => void;
};

export function Header({ view, onNavigate }: HeaderProps) {
  const { profile, family, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-parchment-50/90 backdrop-blur-md border-b border-parchment-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left hidden sm:block">
            <h1 className="text-lg font-serif font-bold text-ink-900 leading-none">
              Elder Wisdom Vault
            </h1>
            {family && (
              <p className="text-xs text-ink-500 mt-0.5">{family.name}</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {view !== 'feed' && (
            <button
              onClick={() => onNavigate('feed')}
              className="btn-ghost flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Vault</span>
            </button>
          )}
          {view !== 'upload' && (
            <button
              onClick={() => onNavigate('upload')}
              className="btn-primary flex items-center gap-1.5 !py-2 !px-4 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Story</span>
            </button>
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-parchment-100 rounded-lg">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-amber-700">
                {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <span className="text-sm font-medium text-ink-700">
              {profile?.full_name ?? 'User'}
            </span>
          </div>
          <button
            onClick={signOut}
            className="btn-ghost flex items-center gap-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
