import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AuthPage } from '@/components/AuthPage';
import { Header } from '@/components/Header';
import { VaultFeed } from '@/components/VaultFeed';
import { UploadForm } from '@/components/UploadForm';
import { StoryDetail } from '@/components/StoryDetail';
import type { Story } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type View = 'feed' | 'upload' | 'detail';

function AppContent() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('feed');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const handleNavigate = (newView: 'feed' | 'upload') => {
    setView(newView);
    setSelectedStory(null);
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setView('detail');
  };

  return (
    <div className="min-h-screen bg-parchment-50">
      <Header view={view} onNavigate={handleNavigate} />
      <main>
        {view === 'feed' && (
          <VaultFeed
            onSelectStory={handleSelectStory}
            onUpload={() => handleNavigate('upload')}
          />
        )}
        {view === 'upload' && (
          <UploadForm onDone={() => handleNavigate('feed')} />
        )}
        {view === 'detail' && selectedStory && (
          <StoryDetail
            story={selectedStory}
            onBack={() => handleNavigate('feed')}
          />
        )}
      </main>
      <footer className="border-t border-parchment-200 mt-12 py-6 text-center text-sm text-ink-400">
        Elder Wisdom Vault — Preserving family stories for generations.
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
