Read AGENTS.md first and follow it strictly.

Use the installed skills for stream and vision agents and implement realtime live captions in the Audio Lesson screen for both the AI teacher's speech and the user's speech, as they happen.

**Define the live-caption transcription contract before implementing Audio Lesson captions: specify the transcription provider, event source, speaker identifier, utterance ID, ordering via sequence or timestamp, and how partial utterances are replaced by final results. Apply the contract consistently to both AI teacher and user speech integrations.**

**Define and implement consent gating before any speech-to-text or Stream transcription starts in the Audio Lesson flow, including a clear disable control. Add explicit deletion triggers and configure retention or deletion for every transcription storage path, accounting for Stream's two-week default and Vision Agents UserTranscriptEvent's lack of built-in retention, including external storage.**