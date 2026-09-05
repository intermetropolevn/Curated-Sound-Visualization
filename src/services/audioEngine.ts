import { TrackConfig, AudioMetrics, PlaybackContext, QueueState } from '../types';
import { updatePlaybackContextTrack } from './playbackContext';

export interface AudioErrorState {
  message: string;
  filename: string;
  url: string;
}

export type AudioEventListener = (state: {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  trackId: string | null;
  currentTrack?: TrackConfig | null;
  audioError: AudioErrorState | null;
  playbackContext?: PlaybackContext | null;
}) => void;

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private audioElement: HTMLAudioElement;

  private currentTrack: TrackConfig | null = null;
  private playbackContext: PlaybackContext | null = null;
  private isPlaying = false;
  private isLoading = false;
  private isMuted = false;
  private volume = 0.85;
  private duration = 240;
  private currentTime = 0;
  private audioError: AudioErrorState | null = null;
  private isAdvancingQueue = false;

  private listeners: Set<AudioEventListener> = new Set();
  private onTrackEndedListeners: Set<() => void> = new Set();
  private frequencyData: Uint8Array = new Uint8Array(128);
  private timeDomainData: Uint8Array = new Uint8Array(128);
  private rafId: number | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'metadata';

    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audioElement.addEventListener('canplay', this.handleCanPlay);
    this.audioElement.addEventListener('ended', this.handleEnded);
    this.audioElement.addEventListener('error', this.handleAudioError);
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.startPlaybackTicker();
      console.log('[AUDIO PLAYING]', this.audioElement.currentSrc || this.audioElement.src);
      this.notifyListeners();
    });
    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.stopPlaybackTicker();
      this.notifyListeners();
    });
  }

  private startPlaybackTicker = () => {
    if (this.rafId !== null) return;
    const tick = () => {
      if (this.isPlaying && this.audioElement) {
        const cur = this.audioElement.currentTime;
        if (Math.abs(cur - this.currentTime) > 0.04) {
          this.currentTime = cur;
          this.notifyListeners();
        }
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  };

  private stopPlaybackTicker = () => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.volume;

      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.masterGain);
      } catch (err) {
        console.warn('[AUDIO CONTEXT]', 'MediaElementSource already connected or crossOrigin restricted:', err);
      }

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch((e) => console.warn('[AUDIO CONTEXT RESUME]', e));
    }
  }

  public async loadTrack(track: TrackConfig, autoPlay = true, isAutoAdvance = false): Promise<void> {
    this.initAudioContext();

    // 1. Stop current audio
    this.audioElement.pause();
    this.isPlaying = false;
    this.currentTrack = track;
    this.currentTime = 0;
    this.audioError = null;
    this.isLoading = true;

    // Parse initial fallback duration if available
    if (track.duration) {
      const parts = track.duration.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        this.duration = parts[0] * 60 + parts[1];
      }
    }

    const targetAudioUrl = track.audioUrl || track.audio;

    if (!targetAudioUrl || typeof targetAudioUrl !== 'string' || !targetAudioUrl.trim()) {
      const filename = track.slug ? `${track.slug}.mp3` : 'audio.mp3';
      this.audioError = {
        message: 'Missing audio source URL.',
        filename,
        url: ''
      };
      this.isLoading = false;
      this.notifyListeners();
      throw new Error(`Track "${track.title}" has no valid audio URL`);
    }

    // Diagnostics per requirements
    console.log('[AUDIO]', track.title);
    console.log('[AUDIO URL]', targetAudioUrl);

    // 2. Set src, reset, volume
    this.audioElement.src = targetAudioUrl;
    this.audioElement.currentTime = 0;
    this.audioElement.volume = this.isMuted ? 0 : this.volume;
    this.notifyListeners();

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        this.audioElement.removeEventListener('canplay', onCanPlay);
        this.audioElement.removeEventListener('loadeddata', onCanPlay);
        this.audioElement.removeEventListener('error', onError);
      };

      const onCanPlay = async () => {
        if (settled) return;
        settled = true;
        cleanup();
        this.isLoading = false;
        this.notifyListeners();

        if (autoPlay) {
          try {
            await this.play();
            resolve();
          } catch (err) {
            if (isAutoAdvance) {
              reject(err);
            } else {
              // Non-fatal if browser blocks manual play without gesture
              resolve();
            }
          }
        } else {
          resolve();
        }
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        this.isLoading = false;
        const filename = track.slug ? `${track.slug}.mp3` : 'audio.mp3';
        const url = this.audioElement.currentSrc || this.audioElement.src;
        this.audioError = {
          message: 'Could not load the source audio.',
          filename,
          url
        };
        this.notifyListeners();
        reject(new Error(`Failed to load audio for track "${track.title}"`));
      };

      this.audioElement.addEventListener('canplay', onCanPlay, { once: true });
      this.audioElement.addEventListener('loadeddata', onCanPlay, { once: true });
      this.audioElement.addEventListener('error', onError, { once: true });

      try {
        this.audioElement.load();
        if (this.audioElement.readyState >= 2) {
          onCanPlay();
        }
      } catch (err) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      }

      // Safety timeout: 7 seconds maximum to allow audio to buffer without locking player
      setTimeout(() => {
        if (!settled) {
          if (this.audioElement.readyState >= 2) {
            onCanPlay();
          } else if (this.audioElement.error) {
            onError();
          } else {
            console.warn('[AUDIO LOAD TIMEOUT] Resource took >7s:', targetAudioUrl);
            if (isAutoAdvance) {
              settled = true;
              cleanup();
              reject(new Error(`Audio load timed out for track "${track.title}"`));
            } else {
              settled = true;
              cleanup();
              resolve();
            }
          }
        }
      }, 7000);
    });
  }

  private handleLoadedMetadata = () => {
    if (this.audioElement.duration && !isNaN(this.audioElement.duration) && this.audioElement.duration > 0) {
      this.duration = this.audioElement.duration;
    }
    this.isLoading = false;
    console.log('[AUDIO READY]', this.audioElement.readyState);
    this.notifyListeners();
  };

  private handleCanPlay = () => {
    this.isLoading = false;
    this.notifyListeners();
  };

  private handleAudioError = () => {
    const filename = this.currentTrack?.slug ? `${this.currentTrack.slug}.mp3` : 'audio.mp3';
    const url = this.audioElement.currentSrc || this.audioElement.src;
    console.error('[AUDIO FAILED]', url, this.audioElement.error);

    this.audioError = {
      message: 'Could not load the source audio.',
      filename,
      url
    };
    this.isPlaying = false;
    this.isLoading = false;
    this.notifyListeners();
  };

  private handleTimeUpdate = () => {
    this.currentTime = this.audioElement.currentTime;
    if (this.audioElement.duration && !isNaN(this.audioElement.duration) && this.audioElement.duration > 0) {
      this.duration = this.audioElement.duration;
    }
    this.notifyListeners();
  };

  private handleEnded = async () => {
    console.log('[AUDIO ENDED]', this.currentTrack?.title);
    this.isPlaying = false;
    this.notifyListeners();

    this.onTrackEndedListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('[AUDIO ON_TRACK_ENDED ERROR]', e);
      }
    });

    // AUTO PLAY FLOW:
    // When the current audio reaches its natural end:
    // 1. Detect the playback ended event.
    // 2. Ask the active playback queue for the next track.
    // 3. Update currentTrack.
    // 4. Load the next audio source.
    // 5. Continue playback automatically.
    // 6. Update player metadata/UI.
    // 7. Continue until the queue is exhausted.
    await this.playNextTrack('auto');
  };

  public onTrackEnded(listener: () => void): () => void {
    this.onTrackEndedListeners.add(listener);
    return () => {
      this.onTrackEndedListeners.delete(listener);
    };
  }

  /**
   * Advances playback to the next track within the active queue.
   * Handles edge cases:
   * - missing next track / queue exhausted
   * - missing audio URLs (gracefully skips to next candidate)
   * - failed audio loading (gracefully skips to next candidate)
   * - deleted / corrupted track entries
   * - never creates an infinite loop (bounded by remaining queue length)
   */
  public async playNextTrack(reason: 'auto' | 'manual' = 'auto'): Promise<boolean> {
    if (this.isAdvancingQueue) {
      console.warn('[AUDIO QUEUE] Queue advance already in progress, skipping redundant trigger');
      return false;
    }

    const ctx = this.playbackContext;
    if (!ctx) {
      console.warn('[AUDIO QUEUE] No active playback context found to advance');
      return false;
    }

    this.isAdvancingQueue = true;

    try {
      let currentCtx = this.playbackContext || ctx;
      const maxAttempts = currentCtx.queue.length;
      let attempts = 0;

      while (currentCtx.nextTrack && attempts < maxAttempts) {
        attempts++;
        const candidate = currentCtx.nextTrack;
        const candidateIdx = currentCtx.currentPosition + 1;

        console.log(`[AUDIO QUEUE ADVANCE] [${reason.toUpperCase()}] Evaluating candidate #${candidateIdx}: ${candidate.number} ${candidate.title}`);

        // Edge case: Deleted / null candidate
        if (!candidate || !candidate.id) {
          console.warn(`[AUDIO SKIP] Candidate at index ${candidateIdx} is invalid. Skipping.`);
          currentCtx = updatePlaybackContextTrack(currentCtx, candidate || ({ id: `unknown-${attempts}` } as TrackConfig), candidateIdx);
          this.setPlaybackContext(currentCtx);
          continue;
        }

        // Edge case: Missing audio URL
        const targetAudioUrl = candidate.audioUrl || candidate.audio;
        if (!targetAudioUrl || typeof targetAudioUrl !== 'string' || !targetAudioUrl.trim()) {
          console.warn(`[AUDIO SKIP] Track "${candidate.title}" has no audio URL. Gracefully skipping to next candidate.`);
          currentCtx = updatePlaybackContextTrack(currentCtx, candidate, candidateIdx);
          this.setPlaybackContext(currentCtx);
          continue;
        }

        // Candidate has a URL; attempt to load and play
        try {
          currentCtx = updatePlaybackContextTrack(currentCtx, candidate, candidateIdx);
          this.setPlaybackContext(currentCtx);
          this.currentTrack = candidate;
          this.notifyListeners();

          await this.loadTrack(candidate, true, true);
          console.log(`[AUDIO QUEUE PLAYING] Successfully transitioned to: ${candidate.number} ${candidate.title}`);
          return true;
        } catch (loadErr) {
          console.warn(`[AUDIO SKIP] Candidate "${candidate.title}" failed to load or play. Skipping to next candidate.`, loadErr);
          // Loop continues to test the following track in currentCtx.nextTrack
        }
      }

      // If loop finishes without returning, queue is exhausted or no candidate could be loaded
      console.log('[QUEUE EXHAUSTED] Reached end of playback queue or no further playable tracks found.');
      this.isPlaying = false;
      this.isLoading = false;
      this.notifyListeners();
      return false;
    } finally {
      this.isAdvancingQueue = false;
    }
  }

  /**
   * Rewinds or moves back to the previous track in the active queue.
   */
  public async playPrevTrack(): Promise<boolean> {
    if (this.currentTime > 3) {
      this.seek(0);
      return true;
    }

    const ctx = this.playbackContext;
    if (!ctx) {
      this.seek(0);
      return false;
    }

    if (ctx.currentPosition > 0) {
      const prevIdx = ctx.currentPosition - 1;
      const prevTrack = ctx.queue[prevIdx];
      if (prevTrack) {
        const updatedCtx = updatePlaybackContextTrack(ctx, prevTrack, prevIdx);
        this.setPlaybackContext(updatedCtx);
        this.currentTrack = prevTrack;
        this.notifyListeners();
        await this.loadTrack(prevTrack, true);
        return true;
      }
    }

    this.seek(0);
    return false;
  }

  public setPlaybackContext(context: PlaybackContext | null) {
    this.playbackContext = context;
    if (typeof window !== 'undefined') {
      (window as unknown as { __SONOVERSE_PLAYBACK_CONTEXT__?: PlaybackContext | null }).__SONOVERSE_PLAYBACK_CONTEXT__ =
        context;
      (window as unknown as { __SONOVERSE_QUEUE_STATE__?: QueueState }).__SONOVERSE_QUEUE_STATE__ =
        this.getQueueState();
    }
    this.notifyListeners();
  }

  public getPlaybackContext(): PlaybackContext | null {
    return this.playbackContext;
  }

  public getQueueState(): QueueState {
    if (this.playbackContext) {
      return {
        currentTrack: this.playbackContext.currentTrack,
        nextTrack: this.playbackContext.nextTrack,
        remainingQueue: this.playbackContext.remainingQueue,
        queueMode: this.playbackContext.queueMode,
      };
    }
    return {
      currentTrack: this.currentTrack,
      nextTrack: null,
      remainingQueue: [],
      queueMode: 'catalog',
    };
  }

  public async play() {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('[AUDIO CONTEXT RESUME]', e);
      }
    }

    try {
      await this.audioElement.play();
      this.isPlaying = true;
      this.audioError = null;
      console.log('[AUDIO PLAYING]', this.audioElement.currentSrc || this.audioElement.src);
      this.notifyListeners();
    } catch (err: unknown) {
      const errorObj = err as Error;
      // AbortError is benign if user switched track while loading
      if (errorObj?.name !== 'AbortError') {
        console.error('[AUDIO FAILED]', this.audioElement.currentSrc || this.audioElement.src, this.audioElement.error || errorObj);
        const filename = this.currentTrack?.slug ? `${this.currentTrack.slug}.mp3` : 'audio.mp3';
        this.audioError = {
          message: 'Could not load the source audio.',
          filename,
          url: this.audioElement.src || (this.currentTrack?.audioUrl || this.currentTrack?.audio || '')
        };
        this.isPlaying = false;
        this.isLoading = false;
        this.notifyListeners();
      }
    }
  }

  public pause() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.notifyListeners();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(timeInSeconds: number) {
    const clamped = Math.max(0, Math.min(timeInSeconds, this.duration));
    this.currentTime = clamped;
    this.audioElement.currentTime = clamped;
    this.notifyListeners();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(val, 1));
    this.audioElement.volume = this.isMuted ? 0 : this.volume;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    }
    this.notifyListeners();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
  }

  public async retryCurrentTrack() {
    if (this.currentTrack) {
      await this.loadTrack(this.currentTrack, true);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }

  public getAudioMetrics(): AudioMetrics {
    const freq = this.getFrequencyData();
    const len = freq.length;
    if (len === 0) {
      return { bass: 0, mid: 0, treble: 0, overallVolume: 0, energy: 0, isPeak: false };
    }

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    const bassEnd = Math.floor(len * 0.15);
    const midEnd = Math.floor(len * 0.6);

    for (let i = 0; i < len; i++) {
      const val = freq[i] / 255;
      totalSum += val;
      if (i < bassEnd) {
        bassSum += val;
      } else if (i < midEnd) {
        midSum += val;
      } else {
        trebleSum += val;
      }
    }

    const bass = bassSum / (bassEnd || 1);
    const mid = midEnd > bassEnd ? midSum / (midEnd - bassEnd) : 0;
    const treble = len > midEnd ? trebleSum / (len - midEnd) : 0;
    const overallVolume = totalSum / len;
    const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

    return {
      bass,
      mid,
      treble,
      overallVolume,
      energy,
      isPeak: bass > 0.68 || energy > 0.72
    };
  }

  public subscribe(listener: AudioEventListener): () => void {
    this.listeners.add(listener);
    listener({
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      trackId: this.currentTrack?.id || null,
      currentTrack: this.currentTrack,
      audioError: this.audioError,
      playbackContext: this.playbackContext
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      trackId: this.currentTrack?.id || null,
      currentTrack: this.currentTrack,
      audioError: this.audioError,
      playbackContext: this.playbackContext
    };
    this.listeners.forEach((fn) => fn(state));
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      currentTrack: this.currentTrack,
      audioError: this.audioError,
      playbackContext: this.playbackContext
    };
  }
}

export const audioEngine = new AudioEngine();
