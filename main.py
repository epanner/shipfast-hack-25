import whisper
import os
import anthropic

from typing import Union, List

from dotenv import load_dotenv
load_dotenv()

import os
from anthropic import Anthropic

# Load from environment
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = "claude-3-haiku-20240307"

client = Anthropic(api_key=CLAUDE_API_KEY)


# === CONFIGURATION ===
CLAUDE_MODEL = "claude-3-haiku-20240307"  # use "claude-3-opus-20240229" for higher quality
MAX_TOKENS = 300

# === STEP 1: Transcribe audio using Whisper ===
def transcribe_audio(audio_path: str) -> str:
    model = whisper.load_model("base")  # you can use 'small', 'medium', or 'large' too
    result = model.transcribe(audio_path)
    return result["text"]

# === STEP 2: Summarize the transcript using Claude ===
from anthropic import Anthropic

def summarize_text_with_claude(text: str, target_language: str = "french") -> list:
    client = Anthropic(api_key=CLAUDE_API_KEY)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": (
                    f"This is a transcript of a voice message:\n\n{text}\n\n"
                    f"Please summarize the key points in bullet points. "
                    f"Then, translate the summary into {target_language}. "
                    f"Only output the translated bullet points."
                )
            }
        ]
    )

    summary_text = response.content[0].text.strip()
    summary_lines = [line.strip("-• ").strip() for line in summary_text.splitlines() if line.strip()]
    return summary_lines

# === STEP 2: Summarize the transcript using Claude ===
#from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
#
#def summarize_text_with_claude(text: str) -> list:
#    client = Anthropic(api_key=CLAUDE_API_KEY)
#
#    response = client.messages.create(
#        model=CLAUDE_MODEL,  # e.g. "claude-3-haiku-20240307"
#        max_tokens=300,
#        messages=[
#            {
#                "role": "user",
#                "content": f"Here is a transcript of a voice message:\n\n{text}\n\nPlease summarize the key points clearly in bullet points."
#            }
#        ]
#    )
#
#    summary_text = response.content[0].text.strip()
#    summary_lines = [line.strip("-• ").strip() for line in summary_text.splitlines() if line.strip()]
#    return summary_lines

client = Anthropic(api_key=CLAUDE_API_KEY)

def translate_with_claude(
    text: Union[str, List[str]],
    target_language: str
) -> List[str]:
    """
    Translates a string or list of strings into the specified target language using Claude.

    Args:
        text (str or List[str]): The message(s) to translate.
        target_language (str): Target language name (e.g., "French", "German").

    Returns:
        List[str]: Translated message(s)
    """
    if isinstance(text, str):
        text_list = [text]
    else:
        text_list = text

    # Join all texts into one prompt
    joined_text = "\n".join(f"- {t}" for t in text_list)

    prompt = (
        f"Translate the following messages into {target_language}. "
        f"Preserve the tone and meaning as much as possible. Output only the translations:\n\n"
        f"{joined_text}"
    )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    output = response.content[0].text.strip()
    translated_lines = [line.strip("-• ").strip() for line in output.splitlines() if line.strip()]
    return translated_lines

# === STEP 3: Main pipeline function ===
def process_audio_file(audio_path: str) -> list:
    print("🔊 Transcribing audio...")
    transcript = transcribe_audio(audio_path)

    print("🧠 Sending transcript to Claude for summarization...")
    summary = summarize_text_with_claude(transcript)

    return summary

if __name__ == "__main__":
    audio_file = "test.mp3"  # Path to your .mp3 or .wav file
    summary = process_audio_file(audio_file)

    print("\n📋 Final Summary:")
    for line in summary:
        print("-", line)
