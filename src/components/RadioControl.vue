<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { io } from 'socket.io-client';
import emitter from "../plugins/emitter";
import { RADIO_SERVER_URL } from "../config.js";
import { useUserStore } from '../stores/user';

const props = defineProps({
 gameInstance: Object
});

const userStore = useUserStore();

// Проверка на администратора (id = 1)
const isAdmin = computed(() => { 
 return userStore.user?.id === 1;
});

// Radio state
const isPlaying = ref(false);
const isMuted = ref(true);
const volume = ref(20);
const selectedQuality = ref('medium');
const showRadio = ref(false);
const showPlaylist = ref(false);
const currentTrack = ref({
 id: null,
 title: 'Loading...',
 artist: '',
 duration: 0,
 position: 0
});
const listeners = ref(0);
const audioElement = ref(null);
const socket = ref(null);
const progressInterval = ref(null);
const progress = ref(0);
const playlist = ref([]);

// Track state management
const currentTrackId = ref(null); // Track ID for validation
const audioCanPlay = ref(false);
const wsState = ref('disconnected');
const lastConnectionTime = ref(Date.now());
const needsSync = ref(true);
const lastTrackLoadTime = ref(0);
const loadAttempts = ref(0);

// Connection tracking
const isReconnecting = ref(false);
const lastSyncTime = ref(0);

// Sync threshold - only sync if difference is 3 seconds or more
const SYNC_THRESHOLD = 3;
// Max load attempts before forcing a page refresh
const MAX_LOAD_ATTEMPTS = 5;

const qualityOptions = [
 { value: 'low', label: 'Low (64kbps)' },
 { value: 'medium', label: 'Medium (128kbps)' },
 { value: 'high', label: 'High (192kbps)' },
 { value: 'premium', label: 'Premium (320kbps)' },
];

const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref(null);
const uploadSuccess = ref(false);
const uploadForm = ref({
 file: null,
 title: '',
 artist: ''
});
const showUploadForm = ref(false);

// Toggle radio panel visibility
function toggleRadio() {
 showRadio.value = !showRadio.value;
}

// Toggle playlist visibility
function togglePlaylist() {
 showPlaylist.value = !showPlaylist.value;
 if (showPlaylist.value) {
  fetchPlaylist();
 }
}

// Fetch playlist from server
async function fetchPlaylist() {
 try {
  const response = await fetch(`${RADIO_SERVER_URL}/tracks`);
  if (response.ok) {
   playlist.value = await response.json();
   console.log("Playlist loaded:", playlist.value);
  } else {
   console.error("Failed to fetch playlist:", response.statusText);
  }
 } catch (error) {
  console.error("Error fetching playlist:", error);
 }
}

// Admin function to play a specific track
function playTrack(trackId) {
 if (!isAdmin.value) return;
 
 if (socket.value?.connected) {
  console.log(`Admin is selecting track ${trackId}`);
  socket.value.emit('select_track', {
   trackId: trackId,
   admin: true
  });
 }
}

// Admin function to skip track
function skipTrack() {
 if (!isAdmin.value) return;
 
 if (socket.value?.connected) {
  console.log("Admin is skipping track");
  socket.value.emit('skip_track', { admin: true });
 }
}

// Admin function to toggle play/pause for everyone
function adminTogglePlay() {
 if (!isAdmin.value) return;
 
 if (socket.value?.connected) {
  console.log(`Admin is toggling playback state to: ${!isPlaying.value}`);
  socket.value.emit('play_pause', { admin: true });
 }
}

// Initialize radio player
onMounted(() => {
 // Create audio element
 audioElement.value = new Audio();
 
 // Set initial volume
 audioElement.value.volume = volume.value / 100;
 
 // Connect to radio socket server
 connectSocket();
 
 // Update progress bar
 progressInterval.value = setInterval(updateProgress, 1000);
 
 // Listen for radio commands from other components
 emitter.on('radio-toggle', toggleRadio);
 
 // If admin, fetch the playlist on mount
 if (isAdmin.value) {
  fetchPlaylist();
 }
});

onUnmounted(() => {
 // Clean up resources
 if (socket.value) {
  socket.value.disconnect();
 }
 
 if (progressInterval.value) {
  clearInterval(progressInterval.value);
 }
 
 if (audioElement.value) {
  audioElement.value.pause();
  audioElement.value.src = '';
 }
 
 emitter.off('radio-toggle', toggleRadio);
});

// Connect to WebSocket for radio updates
function connectSocket() {
 const socketPath = window.location.protocol === 'https:'
  ? '/radio/socket.io'  // Production: use the same origin
  : '/radio/socket.io';
 
 const socketURL = window.location.protocol === 'https:'
  ? window.location.origin + '/radio'   // Production: use the same origin
  : RADIO_SERVER_URL + '';        // Development: use direct IP
 
 wsState.value = 'connecting';
 console.log("Connecting to radio server:", socketURL);
 
 socket.value = io(socketURL, {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  path: socketPath,
  upgrade: false,
  forceNew: true
 });
 
 socket.value.on('connect', () => {
  console.log('Connected to radio server');
  wsState.value = 'connected';
  lastConnectionTime.value = Date.now();
  
  // Force track reload on reconnection
  if (isReconnecting.value) {
   console.log("Reconnected - forcing track reload");
   forceTrackReload();
  }
  
  isReconnecting.value = false;
 });
 
 socket.value.on('track_info', (data) => {
  console.log('Received track info:', data);
  
  // Check if the track ID has changed or if title/artist changed
  const trackChanged =
   currentTrackId.value !== data.id ||
   currentTrack.value.title !== data.title ||
   currentTrack.value.artist !== data.artist;
  
  if (trackChanged) {
   console.log(`Track changed from "${currentTrack.value.title}" (ID: ${currentTrackId.value}) to "${data.title}" (ID: ${data.id})`);
   
   // Update track info
   currentTrackId.value = data.id;
   currentTrack.value = {
    id: data.id,
    title: data.title,
    artist: data.artist,
    duration: data.duration,
    position: data.position
   };
   
   // Complete track change - force reload of stream
   forceTrackReload();
  } else {
   // Same track, update position
   currentTrack.value.position = data.position;
   
   // Check if we need to sync
   if (audioElement.value && isPlaying.value && audioCanPlay.value) {
    const now = Date.now();
    // Only sync if it's been at least 2 seconds since last sync
    if (now - lastSyncTime.value > 2000) {
     syncWithServer();
     lastSyncTime.value = now;
    }
   }
  }
  
  // Update listeners count
  listeners.value = data.listeners;
  
  // Handle play/pause state from server
  if (data.is_playing !== isPlaying.value) {
   if (data.is_playing && !isMuted.value) {
    playAudio();
   } else if (!data.is_playing) {
    pauseAudio();
   }
  }
 });
 
 socket.value.on('play_pause_update', (data) => {
  if (data.is_playing && !isMuted.value) {
   playAudio();
  } else {
   pauseAudio();
  }
 });
 
 socket.value.on('disconnect', () => {
  console.log('Disconnected from radio server');
  wsState.value = 'disconnected';
  isReconnecting.value = true;
  needsSync.value = true;
  
  // Pause audio on disconnect to prevent desynchronization
  if (audioElement.value && isPlaying.value) {
   audioElement.value.pause();
  }
 });
}

// Force a complete reload of the current track
function forceTrackReload() {
 // Reset state
 needsSync.value = true;
 audioCanPlay.value = false;
 loadAttempts.value = 0;
 
 // Clear any existing stream
 if (audioElement.value) {
  audioElement.value.pause();
  audioElement.value.src = '';
 }
 
 // Add random parameter to URL to prevent caching
 lastTrackLoadTime.value = Date.now();
 
 // Load the stream with the new track
 loadStream(true);
}

// Load audio stream with selected quality
function loadStream(forceReload = false) {
 if (!audioElement.value) return;
 
 const quality = selectedQuality.value;
 
 // Add cache-busting parameter for track changes
 const cacheBuster = forceReload ? `?_=${Date.now()}` : '';
 const streamUrl = `${RADIO_SERVER_URL}/stream/${quality}${cacheBuster}`;
 
 console.log(`Loading stream: ${streamUrl} (force: ${forceReload})`);
 
 // Track load attempts
 loadAttempts.value++;
 
 // Set the source
 audioElement.value.src = streamUrl;
 
 // Fix URL if needed
 if (audioElement.value.src.includes('/radio/radio')) {
  audioElement.value.src = audioElement.value.src.replace('/radio/radio', '/radio');
 }
 
 // Set up event listeners for the audio element
 audioElement.value.oncanplay = () => {
  console.log("Audio can play now");
  audioCanPlay.value = true;
  
  // Sync with server position
  syncWithServer();
  
  // Start playing if needed
  if (isPlaying.value && !isMuted.value) {
   audioElement.value.play().catch(error => {
    console.error('Error playing audio:', error);
   });
  }
  
  // Reset load attempts counter on successful load
  loadAttempts.value = 0;
 };
 
 audioElement.value.onerror = (e) => {
  console.error('Audio element error:', e);
  audioCanPlay.value = false;
  
  // Check if we've exceeded max attempts
  if (loadAttempts.value >= MAX_LOAD_ATTEMPTS) {
   console.error(`Failed to load audio after ${MAX_LOAD_ATTEMPTS} attempts`);
   // Reset counter but don't retry automatically
   loadAttempts.value = 0;
  } else {
   // Retry with increasing delay
   const delay = 1000 * Math.min(loadAttempts.value, 5);
   console.log(`Retrying to load stream after ${delay}ms (attempt ${loadAttempts.value})`);
   
   setTimeout(() => {
    if (audioElement.value) {
     loadStream(true); // Force reload on retry
    }
   }, delay);
  }
 };
 
 // Add ended event to handle track completion
 audioElement.value.onended = () => {
  console.log("Audio track ended, waiting for next track");
  // Mark that we need to sync when the next track starts
  needsSync.value = true;
 };
 
 // Preload the audio
 audioElement.value.load();
}

// Synchronize with server position
function syncWithServer() {
 if (!audioElement.value || !currentTrack.value.position) return;
 
 // Calculate how far we are from the server position
 const currentTime = audioElement.value.currentTime;
 const serverPosition = currentTrack.value.position;
 const timeDifference = Math.abs(currentTime - serverPosition);
 
 // If the difference is significant or sync is explicitly requested, sync immediately
 if (needsSync.value || timeDifference >= SYNC_THRESHOLD) {
  console.log(`Synchronizing position from ${currentTime.toFixed(2)}s to ${serverPosition.toFixed(2)}s (diff: ${timeDifference.toFixed(2)}s)`);
  
  try {
   // Set the current time to match the server position
   audioElement.value.currentTime = serverPosition;
   
   // Verify the sync worked correctly
   const newPosition = audioElement.value.currentTime;
   const verifyDiff = Math.abs(newPosition - serverPosition);
   
   if (verifyDiff > 1) {
    console.warn(`Sync verification failed, position is ${newPosition.toFixed(2)}s, expected ${serverPosition.toFixed(2)}s`);
    // If major mismatch, consider reloading the stream
    if (verifyDiff > 5 && Date.now() - lastTrackLoadTime.value > 10000) {
     console.warn("Major position mismatch detected, forcing track reload");
     forceTrackReload();
     return;
    }
   } else {
    console.log(`Sync successful, new position: ${newPosition.toFixed(2)}s`);
   }
   
   // Reset the sync flag
   needsSync.value = false;
  } catch (error) {
   console.error('Error syncing audio position:', error);
  }
  
  // If we've made a significant adjustment, log it
  if (timeDifference > 10) {
   console.warn(`Major sync correction: ${timeDifference.toFixed(2)}s`);
  }
 } else {
  console.log(`No sync needed, difference (${timeDifference.toFixed(2)}s) is less than threshold (${SYNC_THRESHOLD}s)`);
 }
}

// Play audio with improved position synchronization
function playAudio() {
 if (!audioElement.value || isMuted.value) return;
 
 // Always sync position before starting playback
 if (currentTrack.value.position > 0) {
  // Force sync regardless of threshold when starting playback
  const currentTime = audioElement.value.currentTime;
  const serverPosition = currentTrack.value.position;
  const timeDifference = Math.abs(currentTime - serverPosition);
  
  console.log(`Before play, current position: ${currentTime.toFixed(2)}s, server position: ${serverPosition.toFixed(2)}s (diff: ${timeDifference.toFixed(2)}s)`);
  
  try {
   // Always set the time when starting playback to ensure synchronization
   audioElement.value.currentTime = serverPosition;
   console.log(`Set position to ${serverPosition.toFixed(2)}s before playing`);
  } catch (error) {
   console.error("Error setting audio position:", error);
  }
  
  needsSync.value = false;
 }
 
 // Start playback
 audioElement.value.play().then(() => {
  console.log("Playback started successfully");
  isPlaying.value = true;
 }).catch(error => {
  console.error('Error playing audio:', error);
  isPlaying.value = false;
  
  // If play fails and we haven't tried to reload, reload the stream
  if (loadAttempts.value === 0) {
   console.log("Play failed, trying to reload stream");
   forceTrackReload();
  }
 });
}

// Pause audio
function pauseAudio() {
 if (audioElement.value) {
  audioElement.value.pause();
  isPlaying.value = false;
 }
}

// Toggle play/pause (local listener only)
function togglePlay() {
 if (isMuted.value) {
  isMuted.value = false;
 }
 
 if (isPlaying.value) {
  pauseAudio();
 } else {
  // Force synchronization before playing
  needsSync.value = true;
  syncWithServer();
  playAudio();
 }
}

// Toggle mute with improved state handling
function toggleMute() {
 isMuted.value = !isMuted.value;
 
 if (isMuted.value) {
  // Just pause playback but remember state
  if (audioElement.value) {
   audioElement.value.pause();
  }
 } else if (isPlaying.value) {
  // When unmuting, first ensure we're at the correct position
  needsSync.value = true;
  syncWithServer();
  playAudio();
 }
}

// Change volume
function changeVolume() {
 if (audioElement.value) {
  audioElement.value.volume = volume.value / 100;
 }
}

// Change quality with improved handling
function changeQuality() {
 console.log(`Changing quality to ${selectedQuality.value}`);
 
 // Force complete stream reload
 forceTrackReload();
}

// Update progress bar with improved synchronization checks
function updateProgress() {
 if (!audioElement.value || !isPlaying.value || !currentTrack.value.duration) return;
 
 const current = audioElement.value.currentTime;
 const duration = currentTrack.value.duration;
 
 // Calculate progress percentage (clamped between 0-100)
 progress.value = Math.max(0, Math.min(100, (current / duration) * 100));
 
 // Periodic sync check (every 5 seconds)
 if (Math.floor(current) % 5 === 0 && audioCanPlay.value) {
  // Get fresh server position
  const serverPosition = currentTrack.value.position;
  const timeDifference = Math.abs(current - serverPosition);
  
  if (timeDifference >= SYNC_THRESHOLD) {
   console.log(`Detected drift of ${timeDifference.toFixed(2)}s during playback, resyncing`);
   syncWithServer();
  }
 }
 
 // Also detect if we're near the end of the track
 if (duration - current < 3 && duration > 0) {
  // We're approaching the end - make sure we're ready for the next track
  needsSync.value = true;
 }
}

// Format time in MM:SS
function formatTime(seconds) {
 if (!seconds) return '0:00';
 const minutes = Math.floor(seconds / 60);
 const secs = Math.floor(seconds % 60);
 return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Calculate remaining time
function remainingTime() {
 if (!currentTrack.value.duration) return '0:00';
 const current = audioElement.value?.currentTime || 0;
 const remaining = currentTrack.value.duration - current;
 return formatTime(remaining > 0 ? remaining : 0);
}

// Format current position
function currentPosition() {
 return formatTime(audioElement.value?.currentTime || 0);
}




// Toggle upload form visibility
function toggleUploadForm() {
 showUploadForm.value = !showUploadForm.value;
 if (!showUploadForm.value) {
  // Reset form when hiding
  resetUploadForm();
 }
}

// Handle file selection
function handleFileSelect(event) {
 const file = event.target.files[0];
 if (!file) return;
 
 uploadForm.value.file = file;
 
 // Try to parse artist and title from filename
 if (file.name.includes(' - ')) {
  const parts = file.name.split(' - ');
  if (parts.length >= 2) {
   // If the form fields are empty, set them from filename
   if (!uploadForm.value.artist) {
    uploadForm.value.artist = parts[0].trim();
   }
   
   if (!uploadForm.value.title) {
    // Remove extension from title
    const titlePart = parts[1].trim();
    uploadForm.value.title = titlePart.substring(0, titlePart.lastIndexOf('.')) || titlePart;
   }
  }
 }
}

// Reset the upload form
function resetUploadForm() {
 uploadForm.value = {
  file: null,
  title: '',
  artist: ''
 };
 uploadProgress.value = 0;
 uploadError.value = null;
 uploadSuccess.value = false;
 
 // Reset the file input
 const fileInput = document.getElementById('track-file-input');
 if (fileInput) fileInput.value = '';
}

// Upload the selected file
async function uploadTrack() {
 if (!uploadForm.value.file) {
  uploadError.value = "Please select a file to upload";
  return;
 }
 
 // Validate file type
 if (!uploadForm.value.file.type.includes('audio/mpeg') &&
  !uploadForm.value.file.name.toLowerCase().endsWith('.mp3')) {
  uploadError.value = "Only MP3 files are supported";
  return;
 }
 
 // Check file size (max 50MB)
 if (uploadForm.value.file.size > 50 * 1024 * 1024) {
  uploadError.value = "File size must be less than 50MB";
  return;
 }
 
 // Create form data for the upload
 const formData = new FormData();
 formData.append('file', uploadForm.value.file);
 formData.append('title', uploadForm.value.title || '');
 formData.append('artist', uploadForm.value.artist || '');
 
 try {
  isUploading.value = true;
  uploadError.value = null;
  
  // Create URL using the RADIO_SERVER_URL constant
  const uploadUrl = `${RADIO_SERVER_URL}/upload`;
  
  // Create XHR request to track progress
  const xhr = new XMLHttpRequest();
  
  // Setup progress tracking
  xhr.upload.addEventListener('progress', (event) => {
   if (event.lengthComputable) {
    uploadProgress.value = Math.round((event.loaded / event.total) * 100);
   }
  });
  
  // Return a promise for the upload
  const response = await new Promise((resolve, reject) => {
   xhr.open('POST', uploadUrl);
   
   xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
     resolve(JSON.parse(xhr.responseText));
    } else {
     try {
      reject(JSON.parse(xhr.responseText));
     } catch (e) {
      reject({ error: 'Upload failed: ' + xhr.statusText });
     }
    }
   };
   
   xhr.onerror = () => {
    reject({ error: 'Network error occurred' });
   };
   
   xhr.send(formData);
  });
  
  // Handle successful upload
  console.log('Upload successful:', response);
  uploadSuccess.value = true;
  
  // Add the new track to the playlist
  if (response.track) {
   playlist.value.push(response.track);
  }
  
  // Reset form after 3 seconds
  setTimeout(() => {
   resetUploadForm();
   showUploadForm.value = false;
  }, 3000);
  
 } catch (error) {
  console.error('Upload error:', error);
  uploadError.value = error.error || 'Upload failed. Please try again.';
 } finally {
  isUploading.value = false;
 }
}

// Watch for changes in playback state for debugging
watch(isPlaying, (newValue) => {
 console.log(`Playback state changed to: ${newValue ? 'playing' : 'paused'}`);
});

// Watch for track ID changes
watch(currentTrackId, (newValue, oldValue) => {
 console.log(`Track ID changed from ${oldValue} to ${newValue}`);
});
</script>

<template>
 <div class="radio-container">
  <!-- Radio toggle button -->
  <button
   @click="toggleRadio"
   class="radio-toggle-btn"
   :class="{ active: showRadio }"
  >
   <span class="material-icons">radio</span>
  </button>
  
  <!-- Radio player panel -->
  <div class="radio-panel" v-if="showRadio">
   <div class="radio-header">
    <h3>Virtual Room Radio</h3>
    <span class="listeners">{{ listeners }} listening now</span>
   </div>
   
   <div class="track-info">
    <div class="track-title">{{ currentTrack.title }}</div>
    <div class="track-artist">{{ currentTrack.artist }}</div>
   </div>
   
   <div class="progress-container">
    <div class="time">{{ currentPosition() }}</div>
    <div class="progress-bar">
     <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
    <div class="time">{{ remainingTime() }}</div>
   </div>
   
   <div class="controls">
    <!-- Play/Pause button with SVG icons -->
    <button @click="toggleMute" class="control-btn">
     <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5zm7 3c0 .74-.16 1.43-.43 2H9.81V10h2.76c.27.57.43 1.26.43 2z"/>
     </svg>
     <svg v-else-if="volume > 50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 9v6h4l5 5V4l-5 5h-4z"/>
     </svg>
     <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5zm7 3c0 .74-.16 1.43-.43 2H9.81V10h2.76c.27.57.43 1.26.43 2z"/>
     </svg>
    </button>
    
    <div class="volume-slider">
     <input
      type="range"
      min="0"
      max="100"
      v-model="volume"
      @input="changeVolume"
     />
    </div>
   </div>
   
   <div class="quality-selector">
    <span>Quality:</span>
    <select v-model="selectedQuality" @change="changeQuality">
     <option v-for="option in qualityOptions" :key="option.value" :value="option.value">
      {{ option.label }}
     </option>
    </select>
   </div>
   
   <!-- Add manual track reload button for user convenience -->
   <button @click="forceTrackReload" class="sync-btn">
    Sync Now
   </button>
   
   <!-- Admin controls - only visible for user with id=1 -->
   <div v-if="isAdmin" class="admin-controls">
    <div class="admin-header">
     <h4>Admin Controls</h4>
    </div>
    
    <div class="admin-buttons">
     <button @click="adminTogglePlay" class="admin-btn">
      {{ isPlaying ? 'Pause' : 'Play' }} (All Users)
     </button>
     <button @click="skipTrack" class="admin-btn">
      Skip Track
     </button>
     <button @click="togglePlaylist" class="admin-btn">
      {{ showPlaylist ? 'Hide' : 'Show' }} Playlist
     </button>
    </div>
    
    <button @click="toggleUploadForm" class="admin-btn upload-btn">
     {{ showUploadForm ? 'Cancel Upload' : 'Upload New Track' }}
    </button>
    
    <!-- Track upload form -->
    <div v-if="showUploadForm" class="upload-form-container">
     <h5>Upload New Track</h5>
     
     <div v-if="!uploadSuccess" class="upload-form">
      <div class="form-group">
       <label for="track-file-input">MP3 File</label>
       <input
        type="file"
        id="track-file-input"
        accept=".mp3,audio/mpeg"
        @change="handleFileSelect"
        :disabled="isUploading"
       />
      </div>
      
      <div class="form-group">
       <label for="track-title">Track Title</label>
       <input
        type="text"
        id="track-title"
        v-model="uploadForm.title"
        placeholder="Enter track title"
        :disabled="isUploading"
       />
      </div>
      
      <div class="form-group">
       <label for="track-artist">Artist</label>
       <input
        type="text"
        id="track-artist"
        v-model="uploadForm.artist"
        placeholder="Enter artist name"
        :disabled="isUploading"
       />
      </div>
      
      <div v-if="uploadError" class="upload-error">
       {{ uploadError }}
      </div>
      
      <div v-if="isUploading" class="upload-progress">
       <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
       </div>
       <div class="progress-text">{{ uploadProgress }}%</div>
      </div>
      
      <button
       @click="uploadTrack"
       class="upload-submit-btn"
       :disabled="isUploading || !uploadForm.file"
      >
       {{ isUploading ? 'Uploading...' : 'Upload Track' }}
      </button>
     </div>
     
     <div v-else class="upload-success">
      <div class="success-icon">✓</div>
      <p>Track uploaded successfully!</p>
     </div>
    </div>
    <!-- Playlist selector (only visible when toggled) -->
    <div v-if="showPlaylist" class="playlist-container">
     <h5>Select Track to Play:</h5>
     <ul class="track-list">
      <li v-for="track in playlist" :key="track.id"
          :class="{ active: track.id === currentTrack.id }"
          @click="playTrack(track.id)">
       {{ track.title }} - {{ track.artist }}
       <span v-if="track.id === currentTrack.id" class="now-playing">Now Playing</span>
      </li>
     </ul>
    </div>
   </div>
  </div>
 </div>
</template>

<style scoped>
/* Existing styles */
.radio-container {
 position: fixed;
 bottom: 100px;
 right: 15%;
 z-index: 0;
}

.radio-toggle-btn {
 background-color: #4CAF50;
 color: white;
 border: none;
 border-radius: 50%;
 width: 50px;
 height: 50px;
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
 transition: all 0.3s ease;
}

.radio-toggle-btn:hover {
 background-color: #45a049;
 transform: scale(1.05);
}

.radio-toggle-btn.active {
 background-color: #f44336;
}

.radio-panel {
 position: absolute;
 bottom: 60px;
 left: 0;
 width: 300px;
 background-color: #222;
 border-radius: 10px;
 padding: 15px;
 color: white;
 box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.radio-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 10px;
}

.radio-header h3 {
 margin: 0;
 font-size: 18px;
}

.listeners {
 font-size: 12px;
 color: #aaa;
}

.track-info {
 margin-bottom: 15px;
 text-align: center;
}

.track-title {
 font-size: 16px;
 font-weight: bold;
 margin-bottom: 5px;
}

.track-artist {
 font-size: 14px;
 color: #aaa;
}

.progress-container {
 display: flex;
 align-items: center;
 margin-bottom: 15px;
}

.time {
 font-size: 12px;
 color: #aaa;
 width: 40px;
}

.progress-bar {
 flex: 1;
 height: 5px;
 background-color: #444;
 border-radius: 5px;
 overflow: hidden;
 margin: 0 10px;
}

.progress-fill {
 height: 100%;
 background-color: #4CAF50;
 transition: width 0.5s ease;
}

.controls {
 display: flex;
 align-items: center;
 margin-bottom: 15px;
}

.control-btn {
 background: none;
 border: none;
 color: white;
 cursor: pointer;
 margin-right: 10px;
 transition: transform 0.2s ease;
}

.control-btn:hover {
 transform: scale(1.1);
}

.volume-slider {
 flex: 1;
 display: flex;
 align-items: center;
}

.volume-slider input {
 width: 100%;
 -webkit-appearance: none;
 height: 4px;
 background: #444;
 border-radius: 2px;
}

.volume-slider input::-webkit-slider-thumb {
 -webkit-appearance: none;
 width: 12px;
 height: 12px;
 background: #4CAF50;
 border-radius: 50%;
 cursor: pointer;
}

.volume-slider input::-moz-range-thumb {
 width: 12px;
 height: 12px;
 background: #4CAF50;
 border-radius: 50%;
 cursor: pointer;
 border: none;
}

.quality-selector {
 display: flex;
 align-items: center;
 font-size: 14px;
 margin-bottom: 10px;
}

.quality-selector span {
 margin-right: 10px;
}

.quality-selector select {
 background-color: #333;
 color: white;
 border: 1px solid #444;
 border-radius: 4px;
 padding: 5px;
 flex: 1;
}

.sync-btn {
 width: 100%;
 background-color: #3a5e9c;
 color: white;
 border: none;
 border-radius: 4px;
 padding: 6px 12px;
 cursor: pointer;
 font-size: 12px;
 transition: background-color 0.2s;
 margin-bottom: 10px;
}

.sync-btn:hover {
 background-color: #4a6eac;
}

/* New admin control styles */
.admin-controls {
 margin-top: 15px;
 border-top: 1px solid #444;
 padding-top: 10px;
}

.admin-header {
 margin-bottom: 10px;
}

.admin-header h4 {
 margin: 0;
 font-size: 16px;
 color: #ff9800;
}

.admin-buttons {
 display: flex;
 flex-wrap: wrap;
 gap: 8px;
 margin-bottom: 10px;
}

.admin-btn {
 background-color: #ff5722;
 color: white;
 border: none;
 border-radius: 4px;
 padding: 6px 12px;
 cursor: pointer;
 font-size: 12px;
 flex: 1;
 min-width: 80px;
 transition: background-color 0.2s;
}

.admin-btn:hover {
 background-color: #e64a19;
}

.playlist-container {
 background-color: #333;
 border-radius: 4px;
 padding: 10px;
 margin-top: 10px;
 max-height: 200px;
 overflow-y: auto;
}

.playlist-container h5 {
 margin: 0 0 8px 0;
 font-size: 14px;
 color: #ccc;
}

.track-list {
 list-style: none;
 padding: 0;
 margin: 0;
}

.track-list li {
 padding: 6px 8px;
 border-radius: 3px;
 margin-bottom: 3px;
 cursor: pointer;
 position: relative;
 font-size: 13px;
}

.track-list li:hover {
 background-color: #444;
}

.track-list li.active {
 background-color: #1e4d2b;
}

.now-playing {
 font-size: 10px;
 background-color: #4CAF50;
 color: white;
 padding: 2px 4px;
 border-radius: 3px;
 margin-left: 6px;
 position: absolute;
 right: 8px;
 top: 50%;
 transform: translateY(-50%);
}


/* Upload */

.upload-btn {
 background-color: #4a6daf;
}

.upload-btn:hover {
 background-color: #5a7dbf;
}

.upload-form-container {
 background-color: #333;
 border-radius: 4px;
 padding: 12px;
 margin-top: 10px;
}

.upload-form-container h5 {
 margin: 0 0 10px 0;
 font-size: 14px;
 color: #ccc;
}

.upload-form {
 display: flex;
 flex-direction: column;
 gap: 10px;
}

.form-group {
 display: flex;
 flex-direction: column;
 gap: 4px;
}

.form-group label {
 font-size: 12px;
 color: #aaa;
}

.form-group input[type="text"] {
 background-color: #444;
 border: 1px solid #555;
 color: #fff;
 padding: 6px 8px;
 border-radius: 3px;
 font-size: 13px;
}

.form-group input[type="file"] {
 background-color: #444;
 border: 1px solid #555;
 color: #fff;
 padding: 6px;
 border-radius: 3px;
 font-size: 12px;
 cursor: pointer;
}

.upload-submit-btn {
 background-color: #4CAF50;
 color: white;
 border: none;
 border-radius: 4px;
 padding: 8px 12px;
 cursor: pointer;
 font-size: 13px;
 transition: background-color 0.2s;
 margin-top: 5px;
}

.upload-submit-btn:hover:not(:disabled) {
 background-color: #45a049;
}

.upload-submit-btn:disabled {
 background-color: #666;
 cursor: not-allowed;
 opacity: 0.7;
}

.upload-error {
 color: #ff6b6b;
 font-size: 12px;
 padding: 4px 0;
}

.upload-progress {
 display: flex;
 align-items: center;
 gap: 10px;
}

.upload-progress .progress-bar {
 height: 8px;
 background-color: #444;
 border-radius: 4px;
 overflow: hidden;
 flex-grow: 1;
}

.upload-progress .progress-fill {
 height: 100%;
 background-color: #4CAF50;
 transition: width 0.3s ease;
}

.upload-progress .progress-text {
 font-size: 12px;
 color: #aaa;
 width: 40px;
 text-align: right;
}

.upload-success {
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: center;
 padding: 10px 0;
}

.upload-success .success-icon {
 color: #4CAF50;
 font-size: 32px;
 margin-bottom: 5px;
}

.upload-success p {
 color: #ddd;
 font-size: 14px;
 text-align: center;
 margin: 0;
}
</style>