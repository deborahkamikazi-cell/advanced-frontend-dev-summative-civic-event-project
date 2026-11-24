class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (samples) this.port.postMessage(samples);
    return true;
  }
}

registerProcessor("announcement-audio-capture", AudioCaptureProcessor);
