export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const WAV_HEADER_BYTES = 44;
// Multer's streaming size limit can reject a file that reaches exactly 5 MB.
export const MAX_RECORDING_SAMPLES = Math.floor((MAX_AUDIO_BYTES - WAV_HEADER_BYTES - 1) / 2);

export function encodeWav(chunks, sampleCount, sampleRate) {
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + sampleCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };
  writeText(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, sampleCount * 2, true);
  let offset = WAV_HEADER_BYTES;
  for (const chunk of chunks) {
    for (const value of chunk) {
      const sample = Math.max(-1, Math.min(1, value));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

export class AudioRecorder {
  constructor({ onProgress, onLimit, onError }) {
    this.onProgress = onProgress;
    this.onLimit = onLimit;
    this.onError = onError;
    this.chunks = [];
    this.sampleCount = 0;
    this.active = false;
    this.cancelled = false;
  }

  async start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode) {
      throw new Error("Recording requires a supported browser on localhost or HTTPS. You can still upload an audio file.");
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 }, video: false });
      if (this.cancelled) {
        await this.dispose();
        return;
      }
      this.context = new AudioContext({ sampleRate: 16000 });
      await this.context.audioWorklet.addModule(new URL("./audio-capture.worklet.js", import.meta.url));
      if (this.cancelled) {
        await this.dispose();
        return;
      }
      this.source = this.context.createMediaStreamSource(this.stream);
      this.capture = new AudioWorkletNode(this.context, "announcement-audio-capture");
      this.capture.onprocessorerror = () => this.onError(new Error("Audio recording stopped unexpectedly. Please record again."));
      this.maxSamples = MAX_RECORDING_SAMPLES;
      this.capture.port.onmessage = ({ data }) => {
        if (!this.active) return;
        const samples = data.subarray(0, this.maxSamples - this.sampleCount);
        this.chunks.push(samples);
        this.sampleCount += samples.length;
        this.onProgress(this.sampleCount / this.context.sampleRate);
        if (this.sampleCount >= this.maxSamples) {
          this.active = false;
          this.onLimit();
        }
      };
      // The worklet outputs silence, keeping capture active without microphone monitoring.
      this.source.connect(this.capture);
      this.capture.connect(this.context.destination);
      this.active = true;
      this.stream.getAudioTracks().forEach((track) => track.addEventListener("ended", () => {
        if (this.active) this.onError(new Error("The microphone disconnected. Please reconnect it and record again."));
      }, { once: true }));
      await this.context.resume();
      if (this.cancelled) await this.dispose();
    } catch (error) {
      await this.dispose();
      throw error;
    }
  }

  async stop() {
    const sampleRate = this.context.sampleRate;
    await this.dispose();
    if (!this.sampleCount) throw new Error("No audio was captured. Please record for a little longer.");
    const wav = encodeWav(this.chunks, this.sampleCount, sampleRate);
    this.chunks = [];
    return {
      file: new File([wav], `announcement-${Date.now()}.wav`, { type: "audio/wav" }),
      duration: this.sampleCount / sampleRate
    };
  }

  async dispose() {
    this.cancelled = true;
    this.active = false;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source?.disconnect();
    this.capture?.disconnect();
    if (this.capture) {
      this.capture.port.onmessage = null;
      this.capture.onprocessorerror = null;
    }
    if (this.context && this.context.state !== "closed") await this.context.close();
  }
}
