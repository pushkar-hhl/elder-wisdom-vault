import { useState, useRef, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  Upload,
  Mic,
  Video,
  Loader2,
  X,
  Tag,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

type UploadFormProps = {
  onDone: () => void;
};

type MediaFile = {
  file: File;
  type: 'audio' | 'video';
  previewUrl: string;
};

export function UploadForm({ onDone }: UploadFormProps) {
  const { user, profile } = useAuth();
  const [elderName, setElderName] = useState('');
  const [region, setRegion] = useState('');
  const [language, setLanguage] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [festivalDate, setFestivalDate] = useState('');
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (!isAudio && !isVideo) {
      setError('Please select an audio or video file.');
      return;
    }

    setError(null);
    setMedia({
      file,
      type: isAudio ? 'audio' : 'video',
      previewUrl: URL.createObjectURL(file),
    });
  };

  const startRecording = async (type: 'audio' | 'video') => {
    setError(null);
    setRecordingType(type);
    try {
      const constraints: MediaStreamConstraints = type === 'video'
        ? { audio: true, video: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType,
        });
        const file = new File([blob], `recording-${Date.now()}.${type === 'video' ? 'webm' : 'webm'}`, {
          type: mimeType,
        });
        setMedia({
          file,
          type,
          previewUrl: URL.createObjectURL(file),
        });
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError('Could not access microphone/camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to upload a story.');
      return;
    }
    if (!media) {
      setError('Please record or upload an audio/video file.');
      return;
    }
    if (!elderName.trim() || !title.trim()) {
      setError('Please provide at least the elder\'s name and a title.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Fetch the user's family_id fresh from the database to avoid stale state
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!userProfile?.family_id) {
        throw new Error('Your family profile is not set up yet. Please sign out and sign back in.');
      }

      const fileExt = media.file.name.split('.').pop() || 'webm';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(fileName, media.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('story-media')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('stories').insert({
        family_id: userProfile.family_id,
        uploaded_by: user.id,
        elder_name: elderName.trim(),
        region: region.trim() || null,
        language_spoken: language.trim() || null,
        title: title.trim(),
        audio_url: media.type === 'audio' ? publicUrl : null,
        video_url: media.type === 'video' ? publicUrl : null,
        tags: tags.length > 0 ? tags : null,
        festival_date: festivalDate || null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => onDone(), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-forest-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-ink-900 mb-2">
          Story Preserved
        </h2>
        <p className="text-ink-500">
          Your family's story has been saved to the vault.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-slide-up">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 mb-2">
        Preserve a Story
      </h2>
      <p className="text-ink-500 mb-8">
        Record or upload an elder's story so it lives on for future generations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Media section */}
        <div className="card p-6">
          <label className="block text-sm font-semibold text-ink-700 mb-3">
            Audio or Video Recording
          </label>

          {!media && !isRecording && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startRecording('audio')}
                  className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-parchment-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  <Mic className="w-7 h-7 text-amber-600" />
                  <span className="text-sm font-medium text-ink-700">Record Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => startRecording('video')}
                  className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-parchment-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  <Video className="w-7 h-7 text-amber-600" />
                  <span className="text-sm font-medium text-ink-700">Record Video</span>
                </button>
              </div>
              <div className="text-center text-sm text-ink-400">or</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-parchment-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
              >
                <Upload className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-ink-700">Upload a file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {isRecording && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-clay-100 rounded-full mb-3 animate-pulse">
                {recordingType === 'video' ? (
                  <Video className="w-7 h-7 text-clay-600" />
                ) : (
                  <Mic className="w-7 h-7 text-clay-600" />
                )}
              </div>
              <p className="text-ink-700 font-medium mb-3">
                Recording {recordingType}...
              </p>
              <button type="button" onClick={stopRecording} className="btn-primary !bg-clay-600 hover:!bg-clay-700">
                Stop Recording
              </button>
            </div>
          )}

          {media && !isRecording && (
            <div className="space-y-3">
              <div className="bg-parchment-50 rounded-xl p-4">
                {media.type === 'video' ? (
                  <video src={media.previewUrl} controls className="w-full rounded-lg" />
                ) : (
                  <audio src={media.previewUrl} controls className="w-full" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">
                  {media.type === 'video' ? 'Video' : 'Audio'} ready
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMedia(null);
                    URL.revokeObjectURL(media.previewUrl);
                  }}
                  className="text-sm text-clay-600 hover:text-clay-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">
              Elder's Name <span className="text-clay-500">*</span>
            </label>
            <input
              type="text"
              value={elderName}
              onChange={(e) => setElderName(e.target.value)}
              placeholder="e.g. Grandma Akua"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">
              Story Title <span className="text-clay-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How our family came to this village"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Kumasi, Ghana"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                Language Spoken
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Twi"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">
              Festival / Ceremony Date
            </label>
            <input
              type="date"
              value={festivalDate}
              onChange={(e) => setFestivalDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="input-field pl-10"
                />
              </div>
              <button type="button" onClick={addTag} className="btn-secondary !px-4 flex items-center gap-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-amber-500 hover:text-amber-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-clay-50 border border-clay-200 text-clay-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading || !media}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {uploading ? 'Saving to Vault...' : 'Save Story'}
          </button>
          <button type="button" onClick={onDone} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
