import assert from "node:assert/strict";
import test from "node:test";
import { encodeWav, MAX_AUDIO_BYTES, MAX_RECORDING_SAMPLES } from "../js/utils/audio-recorder.js";

test("records mono PCM WAV headers and clamps samples across capture chunks", () => {
  const buffer = encodeWav([new Float32Array([-2, -0.5]), new Float32Array([0, 0.5, 2])], 5, 16000);
  const view = new DataView(buffer);
  const text = (offset, length) => new TextDecoder().decode(new Uint8Array(buffer, offset, length));
  assert.equal(text(0, 4), "RIFF");
  assert.equal(text(8, 4), "WAVE");
  assert.equal(text(12, 4), "fmt ");
  assert.equal(text(36, 4), "data");
  assert.equal(view.getUint32(4, true), buffer.byteLength - 8);
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint32(28, true), 32000);
  assert.equal(view.getUint16(32, true), 2);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 10);
  assert.deepEqual(Array.from({ length: 5 }, (_, index) => view.getInt16(44 + index * 2, true)), [-32768, -16384, 0, 16383, 32767]);
});

test("the maximum capture length encodes within the backend's 5 MB limit", () => {
  const buffer = encodeWav([new Float32Array(MAX_RECORDING_SAMPLES)], MAX_RECORDING_SAMPLES, 16000);
  assert.equal(buffer.byteLength, MAX_AUDIO_BYTES - 2);
  assert.equal(new DataView(buffer).getUint32(40, true), buffer.byteLength - 44);
});
