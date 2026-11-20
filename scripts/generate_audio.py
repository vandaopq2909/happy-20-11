"""
Original, royalty-free ambient piano loop for Bloom of Gratitude.
Synthesized from scratch with numpy + a small LAME encoder. No samples.

Run:
  python scripts/generate_audio.py
"""
from pathlib import Path
import math
import wave

import numpy as np
import lameenc

SR = 44100
BPM = 64
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 24
TAIL = 5.0
DURATION = BAR * BARS + TAIL
N = int(DURATION * SR)
rng = np.random.default_rng(20261120)

# A minor / C major dreamy progression. (bass, chord tones)
PROGRESSION = [
    (45, [57, 59, 60, 64, 71]),   # Am9
    (41, [53, 55, 57, 60, 64]),   # Fmaj9
    (48, [55, 59, 62, 64, 67]),   # Cmaj9
    (43, [50, 55, 59, 62, 64]),   # G6/9
    (45, [57, 59, 60, 64, 67]),   # Am9
    (41, [53, 57, 60, 64, 67]),   # Fmaj9
    (38, [50, 53, 57, 60, 64]),   # Dm9
    (43, [55, 59, 62, 67, 69]),   # G6/9
]


def midi_to_hz(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def add_note(buf: np.ndarray, start: float, dur: float, midi: int, vel: float, pan: float = 0.0):
    """Add a soft felt-piano-like note to a stereo buffer."""
    length = max(1, int(dur * SR))
    start_i = int(start * SR)
    end_i = min(buf.shape[1], start_i + length)
    if start_i >= buf.shape[1]:
        return
    length = end_i - start_i
    t = np.arange(length) / SR
    f = midi_to_hz(midi)
    # Inharmonic, gently detuned piano partials.
    sig = np.zeros(length, dtype=np.float64)
    for h in range(1, 10):
        amp = (1.0 / (h ** 1.55)) * (0.7 + 0.3 * math.exp(-((h - 1.0) ** 2) / 9.0))
        inharm = f * h * (1.0 + 0.00028 * h * h)
        phase = rng.uniform(0, math.tau)
        detune = 1.0 + rng.uniform(-0.0007, 0.0007)
        env_h = np.exp(-t * (1.5 + 0.28 * h))
        sig += amp * env_h * np.sin(math.tau * inharm * detune * t + phase)
    # Hammer felt / attack.
    attack = 1.0 - np.exp(-t / 0.0065)
    body = np.exp(-t / (5.8 - 0.035 * max(0, midi - 45)))
    release = np.clip((dur - t) / 0.5, 0, 1) ** 1.4
    env = attack * body * release
    sig *= env
    # A touch of soft knock noise at the onset.
    noise_len = min(length, int(0.03 * SR))
    knock = rng.normal(0, 1, noise_len) * np.exp(-np.linspace(0, 8, noise_len))
    sig[:noise_len] += knock * 0.011
    sig *= vel
    # Constant-power pan.
    angle = (np.clip(pan, -1, 1) + 1) * math.pi / 4
    buf[0, start_i:end_i] += sig * math.cos(angle)
    buf[1, start_i:end_i] += sig * math.sin(angle)


def add_pad(buf: np.ndarray, start: float, dur: float, notes: list[int], vel: float):
    length = max(1, int(dur * SR))
    start_i = int(start * SR)
    end_i = min(buf.shape[1], start_i + length)
    if start_i >= buf.shape[1]:
        return
    length = end_i - start_i
    t = np.arange(length) / SR
    env = np.minimum(t / 1.8, 1) * np.minimum((dur - t) / 2.2, 1)
    env = np.clip(env, 0, 1) ** 1.2
    sig = np.zeros(length, dtype=np.float64)
    for i, n in enumerate(notes):
        f = midi_to_hz(n + 12)
        for detune in (-0.0018, 0.0018):
            lfo = 1.0 + 0.0018 * np.sin(math.tau * (0.08 + i * 0.01) * t + i)
            sig += np.sin(math.tau * f * (1 + detune) * lfo * t + i * 1.7) * 0.48
    sig *= env * vel / max(1, len(notes))
    angle = math.pi / 4
    buf[0, start_i:end_i] += sig * math.cos(angle)
    buf[1, start_i:end_i] += sig * math.sin(angle)


def add_reverb(dry: np.ndarray, amount: float = 0.32) -> np.ndarray:
    """Convolution reverb with a generated stereo hall impulse."""
    ir_len = int(2.9 * SR)
    t = np.arange(ir_len) / SR
    decay = np.exp(-t * 2.1)
    ir = np.zeros((2, ir_len))
    early = [(0.013, 0.30), (0.021, 0.23), (0.034, 0.18), (0.055, 0.12), (0.081, 0.08)]
    for delay, gain in early:
        idx = int(delay * SR)
        ir[0, idx] += gain
        ir[1, idx + 17] += gain * 0.92
    for ch in range(2):
        noise = rng.normal(0, 1, ir_len)
        # A simple one-pole low-pass to keep the tail dark.
        smooth = np.copy(noise)
        for i in range(1, ir_len):
            smooth[i] = smooth[i - 1] * 0.72 + noise[i] * 0.28
        ir[ch] += smooth * decay * 0.55
    # Normalize impulse energy.
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) * 6.0
    n_fft = 1 << (int(np.ceil(np.log2(dry.shape[1] + ir_len))) + 1)
    wet = np.zeros_like(dry)
    for ch in range(2):
        spec = np.fft.rfft(dry[ch], n=n_fft) * np.fft.rfft(ir[ch], n=n_fft)
        wet[ch] = np.fft.irfft(spec, n=n_fft)[: dry.shape[1]]
    return dry * (1.0 - amount * 0.35) + wet * amount


def build() -> np.ndarray:
    buf = np.zeros((2, N), dtype=np.float64)

    # Sustained pad, one chord per bar, warm and distant.
    for bar in range(BARS):
        bass, chord = PROGRESSION[bar % len(PROGRESSION)]
        start = bar * BAR
        add_pad(buf, start, BAR + 0.9, [bass + 12, *chord[:3]], 0.030)
        # Low root, very soft.
        add_note(buf, start, BAR * 0.92, bass - 12, 0.12, -0.08)

    # Left-hand arpeggios.
    arp_pattern = [0, 2, 4, 2, 1, 3, 4, 2]
    for bar in range(BARS):
        bass, chord = PROGRESSION[bar % len(PROGRESSION)]
        tones = [bass + 12] + chord
        for step in range(8):
            idx = arp_pattern[step] % len(tones)
            note = tones[idx]
            if step == 0:
                note = bass
            velocity = 0.19 + 0.035 * (1 if step in (0, 4) else 0)
            if bar >= 16:
                velocity *= 0.92
            add_note(buf, bar * BAR + step * BEAT / 2, 2.4, note, velocity, -0.26 + step * 0.03)

    # Right-hand melody: enters after the intro, breathes, then resolves.
    melody = [
        # (bar offset within 8-bar phrase, beat, midi, beats)
        (2, 0.0, 76, 2.0), (2, 2.0, 74, 1.5), (2, 3.5, 72, 1.5),
        (3, 0.0, 71, 2.5), (3, 2.5, 69, 2.0),
        (4, 0.0, 72, 1.5), (4, 1.5, 74, 1.5), (4, 3.0, 76, 2.0),
        (5, 0.0, 79, 2.0), (5, 2.0, 76, 1.5), (5, 3.5, 74, 1.5),
        (6, 0.0, 72, 2.5), (6, 2.5, 71, 1.5),
        (7, 0.0, 69, 3.0), (7, 3.0, 67, 2.0),
    ]
    for phrase in range(3):
        amp = [0.0, 0.24, 0.30][phrase]
        if amp == 0:
            continue
        for bar_off, beat, note, beats in melody:
            if phrase == 2 and bar_off in (0, 1):
                continue
            start = (phrase * 8 + bar_off) * BAR + beat * BEAT
            # sparkle an octave above for the final phrase
            add_note(buf, start, beats * BEAT + 2.4, note, amp, 0.22)
            if phrase == 2 and beats >= 2:
                add_note(buf, start + 0.02, beats * BEAT + 1.6, note + 12, amp * 0.28, 0.38)

    # Delicate high bell motifs, sparse and glassy.
    sparkle_bars = [5, 6, 13, 14, 18, 21, 22]
    for bar in sparkle_bars:
        bass, chord = PROGRESSION[bar % len(PROGRESSION)]
        for k in range(3):
            note = chord[(k + 2) % len(chord)] + 24
            start = bar * BAR + 0.5 * BEAT + k * 1.1 + (bar % 2) * 0.2
            add_note(buf, start, 3.0, note, 0.030, 0.45 - k * 0.2)

    wet = add_reverb(buf, 0.30)

    # Gentle tape saturation and a warm high-shelf roll-off.
    wet = np.tanh(wet * 1.3) / 1.3
    # One-pole low-pass to soften the top end.
    for ch in range(2):
        y = np.copy(wet[ch])
        for i in range(1, len(y)):
            y[i] = y[i - 1] * 0.16 + y[i] * 0.84
        wet[ch] = y

    # Keep the loop edges soft, but preserve the natural reverb tail.
    fade_in = int(1.8 * SR)
    fade_out = int(4.0 * SR)
    wet[:, :fade_in] *= np.linspace(0, 1, fade_in) ** 1.5
    wet[:, -fade_out:] *= np.linspace(1, 0, fade_out) ** 1.2

    peak = np.max(np.abs(wet))
    wet = wet / peak * 0.88
    # Fade any click at the very edges.
    wet[:, :128] *= np.linspace(0, 1, 128)
    wet[:, -128:] *= np.linspace(1, 0, 128)
    return wet


def main():
    out = Path(__file__).resolve().parent.parent / "assets" / "audio" / "background-music.mp3"
    out.parent.mkdir(parents=True, exist_ok=True)
    stereo = build()
    pcm = (np.clip(stereo.T, -1, 1) * 32767).astype(np.int16)
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(128)
    encoder.set_in_sample_rate(SR)
    encoder.set_channels(2)
    encoder.set_quality(2)
    mp3 = encoder.encode(pcm.tobytes()) + encoder.flush()
    out.write_bytes(mp3)
    print(f"Wrote {out} ({len(mp3) / 1024 / 1024:.2f} MB, {stereo.shape[1] / SR:.1f}s)")

    # Also keep a tiny waveform preview for documentation/QA.
    mono = np.mean(stereo, axis=0)
    step = max(1, len(mono) // 1200)
    peak_env = np.array([np.max(np.abs(mono[i:i + step])) for i in range(0, len(mono), step)])
    peak_env = (peak_env / max(0.001, peak_env.max()) * 50).astype(int)
    preview = "\n".join(" " * 0 + "▁▂▃▄▅▆▇█"[min(7, int(v / 7))] for v in peak_env[:180])
    (out.parent / "waveform-preview.txt").write_text(preview, encoding="utf-8")


if __name__ == "__main__":
    main()
