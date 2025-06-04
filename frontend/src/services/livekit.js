// services/livekit.js - Serviço LiveKit para streaming
import { 
  connect as livekitConnect, 
  Room, 
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track
} from 'livekit-client';

// Estado global da sala
let room = null;
let isConnecting = false;

/**
 * Conecta a uma sala LiveKit
 * @param {string} token - Token JWT da sala
 * @param {Object} options - Opções de conexão
 * @returns {Promise<Room>} - Instância da sala conectada
 */
export async function connectToRoom(token, options = {}) {
  if (isConnecting) {
    throw new Error('Conexão já em andamento');
  }

  if (room && room.state === 'connected') {
    console.warn('Já conectado a uma sala. Desconectando...');
    await disconnect();
  }

  try {
    isConnecting = true;
    
    // URL do servidor LiveKit
    const url = import.meta.env.VITE_LIVEKIT_URL || 
                import.meta.env.VITE_LIVEKIT_WS_URL || 
                'wss://localhost:7880';

    // Configurações padrão
    const defaultOptions = {
      autoSubscribe: true,
      publishDefaults: {
        videoSimulcastLayers: [
          { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 500_000 } },
          { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: 1_500_000 } }
        ]
      },
      ...options
    };

    // Criar nova sala
    room = new Room(defaultOptions);

    // Event listeners essenciais
    setupRoomListeners(room);

    // Conectar
    await room.connect(url, token);
    
    console.log('✅ Conectado ao LiveKit:', url);
    return room;

  } catch (error) {
    console.error('❌ Erro ao conectar LiveKit:', error);
    room = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Desconecta da sala atual
 */
export async function disconnect() {
  if (room) {
    try {
      await room.disconnect();
      console.log('✅ Desconectado do LiveKit');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    } finally {
      room = null;
      isConnecting = false;
    }
  }
}

/**
 * Retorna a sala atual
 * @returns {Room|null} - Instância da sala ou null
 */
export function getRoom() {
  return room;
}

/**
 * Verifica se está conectado
 * @returns {boolean} - Status da conexão
 */
export function isConnected() {
  return room && room.state === 'connected';
}

/**
 * Adiciona listener de evento
 * @param {string} event - Nome do evento
 * @param {function} callback - Função callback
 */
export function on(event, callback) {
  if (room) {
    room.on(event, callback);
  } else {
    console.warn('Tentativa de adicionar listener sem sala ativa');
  }
}

/**
 * Remove listener de evento
 * @param {string} event - Nome do evento  
 * @param {function} callback - Função callback
 */
export function off(event, callback) {
  if (room) {
    room.off(event, callback);
  }
}

/**
 * Publica track de câmera
 * @param {boolean} enabled - Habilitar câmera
 * @returns {Promise<LocalTrackPublication>}
 */
export async function enableCamera(enabled = true) {
  if (!room) throw new Error('Não conectado a uma sala');
  
  try {
    await room.localParticipant.setCameraEnabled(enabled);
    console.log(`📷 Câmera ${enabled ? 'habilitada' : 'desabilitada'}`);
  } catch (error) {
    console.error('❌ Erro ao controlar câmera:', error);
    throw error;
  }
}

/**
 * Publica track de microfone
 * @param {boolean} enabled - Habilitar microfone
 * @returns {Promise<LocalTrackPublication>}
 */
export async function enableMicrophone(enabled = true) {
  if (!room) throw new Error('Não conectado a uma sala');
  
  try {
    await room.localParticipant.setMicrophoneEnabled(enabled);
    console.log(`🎤 Microfone ${enabled ? 'habilitado' : 'desabilitado'}`);
  } catch (error) {
    console.error('❌ Erro ao controlar microfone:', error);
    throw error;
  }
}

/**
 * Compartilha tela
 * @param {boolean} enabled - Habilitar compartilhamento
 * @returns {Promise<LocalTrackPublication>}
 */
export async function enableScreenShare(enabled = true) {
  if (!room) throw new Error('Não conectado a uma sala');
  
  try {
    await room.localParticipant.setScreenShareEnabled(enabled);
    console.log(`🖥️ Compartilhamento ${enabled ? 'habilitado' : 'desabilitado'}`);
  } catch (error) {
    console.error('❌ Erro ao compartilhar tela:', error);
    throw error;
  }
}

/**
 * Obtém participantes da sala
 * @returns {Object} - Participantes locais e remotos
 */
export function getParticipants() {
  if (!room) return { local: null, remote: [] };
  
  return {
    local: room.localParticipant,
    remote: Array.from(room.remoteParticipants.values())
  };
}

/**
 * Envia dados customizados
 * @param {string|Uint8Array} data - Dados para enviar
 * @param {string[]} destinationSids - SIDs dos destinatários (opcional)
 */
export async function sendData(data, destinationSids = []) {
  if (!room) throw new Error('Não conectado a uma sala');
  
  try {
    const encoder = new TextEncoder();
    const payload = typeof data === 'string' ? encoder.encode(data) : data;
    
    await room.localParticipant.publishData(payload, {
      reliable: true,
      destinationSids
    });
    
    console.log('📤 Dados enviados:', data);
  } catch (error) {
    console.error('❌ Erro ao enviar dados:', error);
    throw error;
  }
}

/**
 * Configura listeners essenciais da sala
 * @param {Room} roomInstance - Instância da sala
 */
function setupRoomListeners(roomInstance) {
  // Conexão estabelecida
  roomInstance.on(RoomEvent.Connected, () => {
    console.log('🎉 Conectado à sala LiveKit');
  });

  // Conexão perdida
  roomInstance.on(RoomEvent.Disconnected, (reason) => {
    console.log('👋 Desconectado da sala:', reason);
  });

  // Erro de conexão
  roomInstance.on(RoomEvent.ConnectionStateChanged, (state) => {
    console.log('🔄 Estado da conexão:', state);
  });

  // Participante conectou
  roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('👤 Participante conectou:', participant.identity);
  });

  // Participante desconectou
  roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('👤 Participante desconectou:', participant.identity);
  });

  // Track publicado
  roomInstance.on(RoomEvent.TrackPublished, (publication, participant) => {
    console.log('📡 Track publicado:', publication.trackSid, participant.identity);
  });

  // Track subscrito
  roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log('📥 Track subscrito:', track.sid, participant.identity);
  });

  // Dados recebidos
  roomInstance.on(RoomEvent.DataReceived, (payload, participant) => {
    const decoder = new TextDecoder();
    const data = decoder.decode(payload);
    console.log('📨 Dados recebidos de', participant?.identity, ':', data);
  });
}

// Export default com todas as funções
export default {
  connectToRoom,
  disconnect,
  getRoom,
  isConnected,
  on,
  off,
  enableCamera,
  enableMicrophone,
  enableScreenShare,
  getParticipants,
  sendData
};

// Export de constantes úteis
export const ROOM_EVENTS = RoomEvent;
export const TRACK_SOURCE = Track.Source;