# Voice references

PersonaForge uses Coqui XTTS v2 for text-to-speech. Each persona can use
either the built-in default XTTS speaker, or a custom reference WAV
dropped into this folder.

## Enabling voice cloning for a persona

Place a clean 5–15 second WAV recording of the target voice at one of
these paths:

```
voices/assistant.wav
voices/tutor.wav
voices/thinker.wav
```

The next call to `POST /api/tts` for that persona will use the file as
the speaker reference, and XTTS will clone the voice.

## Recommended source audio

- **Duration:** 5–15 seconds of continuous speech.
- **Format:** mono PCM WAV, 22050 Hz or 24000 Hz, 16-bit.
- **Content:** clean speech, one speaker, minimal background noise, no
  music, no overlapping voices.
- **Rights:** only use audio you have the right to use. Don't ship
  third-party recordings (interviews, broadcasts, political speeches,
  copyrighted material) with the app.

## Converting a longer recording

`ffmpeg` makes it easy to trim and re-encode source audio to the
expected format:

```bash
ffmpeg -i source.mp3 -ss 30 -t 10 -ac 1 -ar 22050 -acodec pcm_s16le \
       voices/assistant.wav
```

(`-ss 30` skips the first 30 seconds, `-t 10` captures 10 seconds.)

## What happens if a file is missing

If `voices/<persona>.wav` doesn't exist, the TTS service falls back to
XTTS v2's built-in default speaker and logs an INFO message. TTS still
works — it just won't be voice-cloned.

## Storage

This directory is included in version control so the README ships with
the repo, but the WAV files themselves are not committed (see the
project `.gitignore`). Add your own locally.
