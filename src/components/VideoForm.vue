<template>
 <div class="video-form">
  
  <!-- Incoming call panel -->
  <div v-if="isIncomingCall" class="incoming-call-modal">
   <div class="call-content">
    <div class="caller-info">
     <v-avatar class="caller-avatar">
      <v-img v-if="callerImgUrl" :src="`https://escape-iq.com/`+callerImgUrl"></v-img>
      <v-img v-else src="https://images.unsplash.com/photo-1599834562135-b6fc90e642ca"></v-img>
     </v-avatar>
     <div class="caller-text-container">
      <div class="caller-label">mobile</div>
      <h3 class="caller-name">{{ callerName }}</h3>
     </div>
    </div>
    
    <div class="call-row">
     <div class="call-buttons">
      <button @click="rejectCall" class="reject-button animated-button">
       <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="white" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135, 12, 12)"/>
       </svg>
      </button>
      
      <div class="call-status">
       <div class="status-dot"></div>
      </div>
      
      <button @click="acceptCall" class="accept-button animated-button">
       <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="white" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
       </svg>
      </button>
     </div>
    </div>
   </div>
  </div>
  
  <!-- Video call modal -->
  <div v-if="isModalOpen" class="video-call-modal">
   <div class="call-header">
    <div class="live-indicator">
     <span class="live-text">Live</span>
     <div class="live-dot"></div>
    </div>
    <div class="call-timer">
     <span>{{ callDuration }}</span>
     <div class="timer-indicator"></div>
    </div>
    <button @click="closeModal" class="close-modal-button">✕</button>
   </div>
   
   <div class="video-container">
    <video ref="remoteVideo" autoplay class="remote-video"></video>
    <div class="local-video-container">
     <video ref="localVideo" autoplay muted class="local-video"></video>
     <div class="avatar-overlay">
     </div>
    </div>
   </div>
   
   <div class="controls">
    <button @click="toggleVideo" class="control-button video-toggle animated-button">
     <img :src="isVideoOff ? noVideoImage : noVideoImage">
    </button>
    <button @click="toggleMute" class="control-button audio-toggle animated-button">
     <img :src="isAudioMuted ? noAudioImage : noAudioImage">
    </button>
    <button @click="endCall" class="control-button end-call animated-button">
     <img :src="handsOffImage">
    </button>
    <button @click="toggleFullscreen" class="control-button fullscreen-toggle animated-button">
     <img :src="otherImage">
    </button>
   </div>
  </div>
  
  <div v-if="!isIncomingCall && !isModalOpen" class="close-form-button">
   <button @click="closeVideoForm">Закрыть!</button>
  </div>
  
  <!-- Audio elements for sound effects -->
  <audio ref="callRingAudio" loop preload="auto"></audio>
  <audio ref="connectingAudio" loop preload="auto"></audio>
  <audio ref="exitAudio" preload="auto"></audio>
 </div>
</template>

<script>
import emitter from "../plugins/emitter.js";
import { useUserStore } from "../stores/user";

import noVideoImage from '/public/media/no_video.png'
import noAudioImage from '/public/media/no_audio.png'
import handsOffImage from '/public/media/hands_off.png'
import otherImage from '/public/media/other.png'
import {TURN_SERV} from "../config.js";

// Import sound files
import callSound from '/assets/sound/call.mp3'
import connectingSound from '/assets/sound/connecting.mp3'
import exitSound from '/assets/sound/exit.mp3'
import incomeSound from '/assets/sound/income.mp3'

export default {
 data() {
  return {
   isModalOpen: false,
   isIncomingCall: false,
   localStream: null,
   remoteStream: null,
   pc: null,
   callerId: null,
   callerName: '',
   callerImgUrl: null,
   targetUserId: null,
   targetUserName: '',
   targetUserImgUrl: null,
   currentCallId: null,
   callTimeout: null,
   isCaller: false,
   isAudioMuted: false,
   isVideoOff: false,
   isCallInProgress: false,
   isLoadingCallerData: false,
   callDuration: '00:00',
   callTimer: null,
   callStartTime: null,
   noVideoImage,
   noAudioImage,
   handsOffImage,
   otherImage,
   // Sound resources
   soundSources: {
     call: callSound,
     connecting: connectingSound,
     exit: exitSound,
     income: incomeSound
   }
  };
 },
 created() {
  this.userStore = useUserStore();
  
  // Слушаем событие для открытия формы видеозвонка
  emitter.on("open-video-form", (data) => {
   console.log("Received open-video-form event:", data);
   
   if (data.type === 'incoming') {
    // Это входящий звонок
    this.handleIncomingCall({
     callerId: data.callerId,
     callId: data.callId,
     callerName: data.callerName || 'Пользователь' // Имя по умолчанию, если не предоставлено
    });
    
    // Play incoming call sound
    this.playSound('income', true);
   } else if (data.targetId) {
    // Это прямой звонок конкретному пользователю - инициируем звонок напрямую
    this.initiateCallToUser(data.targetId);
   }
  });
  
  // Слушаем событие ответа на звонок
  emitter.on("call-response", (data) => {
   console.log("Received call-response event:", data);
   
   clearTimeout(this.callTimeout);
   
   // Stop any current sounds
   this.stopAllSounds();
   
   if (data.accepted) {
    this.isCallInProgress = true;
    this.startPeerConnection();
    this.startCallTimer();
    
    // Play connecting sound when call is accepted
    this.playSound('connecting', true);
   } else {
    this.endCall();
    alert('Звонок отклонен');
   }
  });
  
  // Слушаем события сигнализации WebRTC
  emitter.on("call-signal", (data) => {
   console.log("Received call-signal event:", data);
   this.handleSignal(data);
  });
 },
 mounted() {
  // Set up audio elements with their sources
  if (this.$refs.callRingAudio) {
   this.$refs.callRingAudio.src = this.soundSources.call;
  }
  
  if (this.$refs.connectingAudio) {
   this.$refs.connectingAudio.src = this.soundSources.connecting;
  }
  
  if (this.$refs.exitAudio) {
   this.$refs.exitAudio.src = this.soundSources.exit;
  }
 },
 methods: {
  // Sound management methods
  playSound(soundType, loop = false) {
   let audioElement;
   
   switch (soundType) {
    case 'call':
    case 'income':
     audioElement = this.$refs.callRingAudio;
     audioElement.src = this.soundSources[soundType];
     break;
    case 'connecting':
     audioElement = this.$refs.connectingAudio;
     audioElement.src = this.soundSources.connecting;
     break;
    case 'exit':
     audioElement = this.$refs.exitAudio;
     audioElement.src = this.soundSources.exit;
     break;
    default:
     return;
   }
   
   if (audioElement) {
    audioElement.loop = loop;
    audioElement.play().catch(err => {
     console.warn('Audio playback error:', err);
    });
   }
  },
  
  stopSound(audioElement) {
   if (audioElement && !audioElement.paused) {
    audioElement.pause();
    audioElement.currentTime = 0;
   }
  },
  
  stopAllSounds() {
   this.stopSound(this.$refs.callRingAudio);
   this.stopSound(this.$refs.connectingAudio);
   this.stopSound(this.$refs.exitAudio);
  },
  
  // Новый метод для инициирования звонка конкретному пользователю
  async initiateCallToUser(userId) {
   if (!this.userStore.isAuthenticated || !this.userStore.user) return;
   
   this.isCaller = true;
   this.targetUserId = userId;
   
   // Создаем уникальный ID звонка
   this.currentCallId = Date.now().toString();
   
   // Получаем дополнительные данные о пользователе (включая изображение и имя)
   try {
    await this.userStore.fetchExternalUserData(userId);
    const userData = this.userStore.externalUserData;
    
    if (userData) {
     this.targetUserName = userData.username || 'Пользователь';
     if (userData.imgurl) {
      this.targetUserImgUrl = userData.imgurl;
     }
    }
    
    // Открываем модальное окно звонка, чтобы показать локальное видео
    this.isModalOpen = true;
    
    // Запускаем локальные медиа перед отправкой запроса на звонок
    await this.startLocalMedia();
    
    // Play outgoing call sound
    this.playSound('call', true);
    
    // Отправляем запрос на звонок через WebSocket в Game.js
    if (window.gameInstance && window.gameInstance.socket) {
     window.gameInstance.socket.send(JSON.stringify({
      type: "call_request",
      target_id: this.targetUserId,
      call_id: this.currentCallId
     }));
    }
    
    // Устанавливаем таймаут для ответа на звонок
    this.callTimeout = setTimeout(() => {
     if (!this.isCallInProgress) {
      this.endCall();
      alert('Пользователь не ответил');
     }
    }, 30000); // 30 секунд
   } catch (error) {
    console.error("Error initiating call:", error);
    this.closeModal();
    alert("Не удалось установить соединение");
   }
  },
  
  async startLocalMedia() {
   try {
    this.localStream = await navigator.mediaDevices.getUserMedia({
     video: true,
     audio: true
    });
    
    if (this.$refs.localVideo) {
     this.$refs.localVideo.srcObject = this.localStream;
    }
    
    return true;
   } catch (err) {
    console.error('Error accessing media devices:', err);
    throw err;
   }
  },
  
  async handleIncomingCall(callData) {
   console.log("Handling incoming call:", callData);
   
   this.isIncomingCall = true;
   this.callerId = callData.callerId;
   this.callerName = callData.callerName || 'Пользователь';
   this.currentCallId = callData.callId;
   this.isCaller = false;
   
   // Устанавливаем флаг загрузки
   this.isLoadingCallerData = true;
   
   try {
    // Получаем данные звонящего пользователя
    await this.userStore.fetchExternalUserData(callData.callerId);
    const userData = this.userStore.externalUserData;
    
    console.log("Fetched caller user data:", userData);
    
    // Если есть данные и изображение, сохраняем URL изображения
    if (userData && userData.imgurl) {
     this.callerImgUrl = userData.imgurl;
    }
    
    // Обновляем имя звонящего, если оно доступно
    if (userData && userData.username) {
     this.callerName = userData.username;
    }
   } catch (err) {
    console.error('Error fetching caller data:', err);
   } finally {
    this.isLoadingCallerData = false;
   }
  },
  
  acceptCall() {
   this.isIncomingCall = false;
   this.isModalOpen = true;
   
   // Stop incoming call sound
   this.stopAllSounds();
   
   // Запускаем локальные медиа сначала
   this.startLocalMedia().then(() => {
    // Отправляем подтверждение через WebSocket
    emitter.emit('video-call-accept', {
     type: "call_response",
     call_id: this.currentCallId,
     accepted: true,
     caller_id: this.callerId
    });
    
    this.isCallInProgress = true;
    this.startPeerConnection();
    this.startCallTimer();
    
    // Play connecting sound when accepting a call
    this.playSound('connecting', true);
   }).catch(error => {
    console.error("Error accessing media devices:", error);
    this.rejectCall();
    alert("Не удалось получить доступ к камере или микрофону");
   });
  },
  
  rejectCall() {
   // Stop incoming call sound
   this.stopAllSounds();
   
   // Отправляем отказ через WebSocket
   emitter.emit('video-call-accept', {
    type: "call_response",
    call_id: this.currentCallId,
    accepted: false,
    caller_id: this.callerId
   });
   
   this.isIncomingCall = false;
   this.endCall();
  },
  
  startCallTimer() {
   this.callStartTime = Date.now();
   this.callTimer = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    this.callDuration = `${minutes}:${seconds}`;
   }, 1000);
  },
  
  async startPeerConnection() {
   try {
    // Настраиваем RTCPeerConnection
    const configuration = {
     iceServers: [
      {urls: 'stun:stun.l.google.com:19302'},
      {urls: 'stun:stun1.l.google.com:19302'},
      TURN_SERV,
     ]
    };
    
    this.pc = new RTCPeerConnection(configuration);
    
    // Добавляем локальные треки к соединению
    this.localStream.getTracks().forEach(track => {
     this.pc.addTrack(track, this.localStream);
    });
    
    // Обрабатываем удаленный поток
    this.pc.ontrack = (event) => {
     this.remoteStream = event.streams[0];
     if (this.$refs.remoteVideo) {
      this.$refs.remoteVideo.srcObject = this.remoteStream;
      
      // When connection is established and remote video is ready
      // stop the connecting sound
      this.stopSound(this.$refs.connectingAudio);
     }
    };
    
    // Обрабатываем ICE-кандидатов
    this.pc.onicecandidate = (event) => {
     if (event.candidate) {
      this.sendSignal({
       type: 'candidate',
       candidate: event.candidate
      });
     }
    };
    
    // Если мы инициируем звонок, создаем и отправляем оффер
    if (this.isCaller) {
     const offer = await this.pc.createOffer();
     await this.pc.setLocalDescription(offer);
     
     this.sendSignal({
      type: 'offer',
      sdp: this.pc.localDescription
     });
    }
   } catch (err) {
    console.error('Error establishing peer connection:', err);
    this.endCall();
    alert('Ошибка установки соединения');
   }
  },
  
  sendSignal(signalData) {
   // Отправляем сигнал WebRTC через WebSocket
   emitter.emit('send-call-request', {
    type: "call_signal",
    call_id: this.currentCallId,
    target_id: this.isCaller ? this.targetUserId : this.callerId,
    signal_data: signalData
   });
  },
  
  async handleSignal(data) {
   if (data.callId !== this.currentCallId) return;
   
   const signalData = data.signalData;
   
   try {
    if (signalData.type === 'offer') {
     await this.pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
     
     const answer = await this.pc.createAnswer();
     await this.pc.setLocalDescription(answer);
     
     this.sendSignal({
      type: 'answer',
      sdp: this.pc.localDescription
     });
    } else if (signalData.type === 'answer') {
     await this.pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
    } else if (signalData.type === 'candidate') {
     await this.pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
    }
   } catch (err) {
    console.error('Error handling signal:', err);
   }
  },
  
  toggleMute() {
   if (this.localStream) {
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length > 0) {
     this.isAudioMuted = !this.isAudioMuted;
     audioTracks[0].enabled = !this.isAudioMuted;
    }
   }
  },
  
  toggleVideo() {
   if (this.localStream) {
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length > 0) {
     this.isVideoOff = !this.isVideoOff;
     videoTracks[0].enabled = !this.isVideoOff;
    }
   }
  },
  
  toggleFullscreen() {
   const videoModal = document.querySelector('.video-call-modal');
   if (!document.fullscreenElement) {
    if (videoModal.requestFullscreen) {
     videoModal.requestFullscreen();
    } else if (videoModal.webkitRequestFullscreen) { /* Safari */
     videoModal.webkitRequestFullscreen();
    } else if (videoModal.msRequestFullscreen) { /* IE11 */
     videoModal.msRequestFullscreen();
    }
   } else {
    if (document.exitFullscreen) {
     document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
     document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
     document.msExitFullscreen();
    }
   }
  },
  
  closeModal() {
   this.endCall();
  },
  
  closeVideoForm() {
   this.closeModal();
   emitter.emit("hide-video-form");
  },
  
  endCall() {
   // Play exit sound
   this.playSound('exit');
   
   // Останавливаем таймер звонка
   if (this.callTimer) {
    clearInterval(this.callTimer);
    this.callTimer = null;
   }
   
   // Очищаем соединение
   if (this.pc) {
    this.pc.close();
    this.pc = null;
   }
   
   // Останавливаем медиа-треки
   if (this.localStream) {
    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null;
   }
   
   // Stop all sounds (after a short delay to allow exit sound to play)
   setTimeout(() => {
    this.stopAllSounds();
   }, 2000);
   
   // Сбрасываем состояние
   this.isModalOpen = false;
   this.isIncomingCall = false;
   this.isCallInProgress = false;
   this.remoteStream = null;
   this.callerId = null;
   this.callerName = '';
   this.callerImgUrl = null;
   this.targetUserId = null;
   this.targetUserName = '';
   this.targetUserImgUrl = null;
   this.currentCallId = null;
   this.isAudioMuted = false;
   this.isVideoOff = false;
   this.callDuration = '00:00';
   
   // Отправляем событие для скрытия формы
   emitter.emit("hide-video-form");
  }
 },
 beforeUnmount() {
  // Очистка при размонтировании компонента
  this.endCall();
  
  // Удаляем обработчики событий
  emitter.off("open-video-form");
  emitter.off("call-response");
  emitter.off("call-signal");
 }
}
</script>

<style scoped>
.video-form {
 position: absolute;
 min-width: 600px;
 min-height: 200px;
 top: 10rem;
 left: 30%;
 font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Incoming call modal styles */
.incoming-call-modal {
 position: fixed;
 top: 50px;
 left: 50%;
 transform: translateX(-50%);
 z-index: 100;
 font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.call-content {
 background: #000000;
 border-radius: 24px;
 box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
 display: flex;
 flex-direction: row;
 align-items: center;
 justify-content: space-between;
 padding: 16px;
 width: 400px;
 height: auto;
}

/* Adjust caller-info to take less vertical space */
.caller-info {
 display: flex;
 flex-direction: row;
 align-items: center;
 margin-bottom: 0;
 margin-right: 10px;
}

.caller-avatar {
 margin-bottom: 0 !important;
 margin-right: 10px !important;
 width: 48px !important;
 height: 48px !important;
 border: 2px solid rgba(255, 255, 255, 0.2);
 overflow: hidden;
}

.caller-text-container {
 display: flex;
 flex-direction: column;
}

.caller-label {
 font-size: 12px;
 color: rgba(255, 255, 255, 0.6);
 margin-bottom: 4px;
}

.caller-name {
 font-size: 16px;
 font-weight: 600;
 color: white;
 margin: 0;
}

.call-row {
 display: contents;
}

.call-status {
 display: flex;
 align-items: center;
 justify-content: center;
 margin: 0 12px;
}

.status-dot {
 width: 8px;
 height: 8px;
 background-color: #3b82f6;
 border-radius: 50%;
 animation: pulseDot 1.5s infinite;
}

@keyframes pulseDot {
 0% {
  transform: scale(1);
  opacity: 1;
 }
 50% {
  transform: scale(1.2);
  opacity: 0.7;
 }
 100% {
  transform: scale(1);
  opacity: 1;
 }
}

.call-buttons {
 display: flex;
 justify-content: center;
 align-items: center;
 width: auto;
 max-width: none;
}

.accept-button, .reject-button {
 width: 48px;
 height: 48px;
 border-radius: 50%;
 border: none;
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 transition: all 0.2s ease;
}

.accept-button {
 background-color: #4CAF50;
}

.accept-button:hover {
 background-color: #43a047;
 transform: scale(1.05);
}

.reject-button {
 background-color: #F44336;
}

.reject-button:hover {
 background-color: #e53935;
 transform: scale(1.05);
}

.button-icon {
 width: 24px;
 height: 24px;
 fill: white;
 min-width: 24px !important;
 display: block;
 position: relative;
 z-index: 2;
}

/* Video call modal styles */
.video-call-modal {
 position: fixed;
 top: 0;
 right: 0;
 bottom: 0;
 max-width: 500px;
 max-height: 400px;
 background: black;
 z-index: 50;
 display: flex;
 flex-direction: column;
}

.call-header {
 background: rgba(0, 0, 0, 0.8);
 padding: 0.5rem;
 display: flex;
 justify-content: space-between;
 align-items: center;
}

.live-indicator {
 display: flex;
 align-items: center;
}

.live-text {
 color: #22c55e;
 font-weight: bold;
 margin-right: 0.5rem;
}

.live-dot {
 width: 0.5rem;
 height: 0.5rem;
 background-color: #22c55e;
 border-radius: 9999px;
 animation: pulseDot 1.5s infinite;
}

.call-timer {
 color: white;
 display: flex;
 align-items: center;
 gap: 0.5rem;
}

.timer-indicator {
 width: 0.5rem;
 height: 0.5rem;
 background-color: #22c55e;
 border-radius: 50%;
}

.close-modal-button {
 color: white;
 font-size: 1.5rem;
 line-height: 1;
 background: none;
 border: none;
 cursor: pointer;
}

.video-container {
 flex-grow: 1;
 position: relative;
 background: #111;
}

.remote-video {
 width: 100%;
 height: 100%;
 object-fit: cover;
}

.local-video-container {
 position: absolute;
 bottom: 1rem;
 right: 1rem;
 width: 25%;
 height: 25%;
 max-width: 8rem;
 border: 2px solid white;
 border-radius: 0.5rem;
 overflow: hidden;
}

.local-video {
 width: 100%;
 height: 100%;
 object-fit: cover;
}

.avatar-overlay {
 position: absolute;
 bottom: 0.25rem;
 right: 0.25rem;
 background: rgba(0, 0, 0, 0.7);
 border-radius: 9999px;
 padding: 0.25rem;
}

.controls {
 background: rgba(0, 0, 0, 0.8);
 padding: 1rem 0;
 display: flex;
 justify-content: center;
 gap: 1.5rem;
}

.control-button {
 width: 3rem;
 height: 3rem;
 border-radius: 9999px;
 display: flex;
 align-items: center;
 justify-content: center;
 transition: background-color 0.3s, transform 0.2s;
 cursor: pointer;
 border: none;
}

.control-button:hover {
 transform: scale(1.1);
}

.control-button img {
 width: 56px;
 height: 56px;
}

.video-toggle, .audio-toggle, .fullscreen-toggle {
 background: rgba(255, 255, 255, 0.1);
}

.video-toggle:hover, .audio-toggle:hover, .fullscreen-toggle:hover {
 background: rgba(255, 255, 255, 0.2);
}

.end-call {
 background: #dc2626;
 padding: 1rem;
}

.end-call:hover {
 background: #b91c1c;
}

.close-form-button {
 text-align: center;
 margin-top: 1rem;
}

.close-form-button button {
 background: #3b82f6;
 color: white;
 padding: 0.5rem 1rem;
 border-radius: 0.25rem;
 border: none;
 cursor: pointer;
 transition: background-color 0.3s;
}

.close-form-button button:hover {
 background: #2563eb;
}

/* Fullscreen styles */
.video-call-modal:fullscreen {
 max-width: 100%;
 max-height: 100%;
}

/* Button animations */
@keyframes buttonPulse {
 0% {
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
 }
 70% {
  box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
 }
 100% {
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
 }
}

@keyframes buttonBounce {
 0%, 20%, 50%, 80%, 100% {
  transform: translateY(0);
 }
 40% {
  transform: translateY(-8px);
 }
 60% {
  transform: translateY(-4px);
 }
}

@keyframes buttonSpin {
 0% {
  transform: rotate(0deg);
 }
 100% {
  transform: rotate(360deg);
 }
}

.animated-button {
 position: relative;
 overflow: hidden;
}

.animated-button:before {
 content: '';
 position: absolute;
 top: 50%;
 left: 50%;
 width: 0;
 height: 0;
 background: rgba(255, 255, 255, 0.2);
 border-radius: 50%;
 transform: translate(-50%, -50%);
 opacity: 0;
 transition: width 0.6s, height 0.6s, opacity 0.6s;
}

.animated-button:active:before {
 width: 200%;
 height: 200%;
 opacity: 1;
 transition: 0s;
}

.accept-button.animated-button {
 animation: buttonPulse 2s infinite;
}

.reject-button.animated-button:hover {
 animation: buttonBounce 1s;
}

.control-button.animated-button:active {
 transform: scale(0.95);
}

.end-call.animated-button:hover {
 animation: buttonSpin 0.5s ease-out;
}
</style>