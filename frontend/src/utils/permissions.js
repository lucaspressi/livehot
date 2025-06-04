/**
 * Helpers for requesting camera and microphone access and
 * checking the current permission status.
 */

export async function requestCamera(constraints = { video: true }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not supported');
  }
  return navigator.mediaDevices.getUserMedia({ ...constraints, audio: false });
}

export async function requestMicrophone(constraints = { audio: true }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone API not supported');
  }
  return navigator.mediaDevices.getUserMedia({ ...constraints, video: false });
}

export async function checkPermissions() {
  const result = { camera: 'prompt', microphone: 'prompt' };

  if (navigator.permissions) {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' });
      result.camera = cam.state;
    } catch (err) {
      /* ignore unsupported */
    }
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' });
      result.microphone = mic.state;
    } catch (err) {
      /* ignore unsupported */
    }
  }

  return result;
}

export default { requestCamera, requestMicrophone, checkPermissions };
