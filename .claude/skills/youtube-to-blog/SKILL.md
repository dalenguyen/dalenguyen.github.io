---
name: youtube-to-blog
description: Use when asked to create a blog post from a YouTube video URL. Triggers on phrases like "create a blog post from this video", "blog post from YouTube", or when given a YouTube URL with intent to document learnings.
---

# YouTube to Blog Post

## Overview

Extracts a YouTube video transcript, analyzes the content for key technical insights, then delegates to the `blog-post-manager` agent to create a properly formatted blog post.

## Workflow

### Step 1: Extract Video ID

Parse the video ID from the URL:
- `https://www.youtube.com/watch?v=VIDEO_ID` → `VIDEO_ID`
- `https://youtu.be/VIDEO_ID` → `VIDEO_ID`

### Step 2: Get Video Title

```bash
python3 -c "
import urllib.request, json
url = 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json'
data = json.loads(urllib.request.urlopen(url).read())
print('Title:', data.get('title', 'Unknown'))
print('Author:', data.get('author_name', 'Unknown'))
"
```

### Step 3: Get Transcript

**Method 1 (primary) — youtube-transcript-api:**

```bash
# Use a venv to avoid Homebrew Python conflicts
python3 -m venv /tmp/yt-env
/tmp/yt-env/bin/pip install youtube-transcript-api -q
/tmp/yt-env/bin/python3 -c "
from youtube_transcript_api import YouTubeTranscriptApi
api = YouTubeTranscriptApi()
segments = api.fetch('VIDEO_ID')
transcript = ' '.join(s.text for s in segments)
print(transcript)
" 2>&1
```

**Method 2 (fallback) — yt-dlp:**

```bash
# Install if missing: brew install yt-dlp
yt-dlp --write-auto-sub --skip-download --sub-format vtt \
  -o "/tmp/%(id)s" "https://www.youtube.com/watch?v=VIDEO_ID"
cat /tmp/VIDEO_ID.en.vtt | grep -v '^[0-9]' | grep -v '^\.' | grep -v '^WEBVTT' | grep -v '^$'
```

If no transcript is available (private video or no captions), inform the user and stop.

### Step 4: Analyze Content

With the transcript in hand, identify:

- **Main topic**: What is the video fundamentally about?
- **Key concepts**: 3–5 major technical ideas or techniques
- **Tools/technologies**: Libraries, frameworks, or platforms discussed
- **Code patterns**: Any specific code approaches demonstrated
- **Practical takeaways**: What can a reader immediately apply?
- **Suggested blog structure**: Logical section order (intro → concepts → examples → conclusion)

Keep the analysis concise — it becomes the brief for the blog-post-manager agent.

### Step 5: Delegate to blog-post-manager Agent

Invoke the `blog-post-manager` agent with this structured brief:

```
Create a technical blog post based on this YouTube video.

VIDEO: [TITLE] by [AUTHOR]
URL: https://www.youtube.com/watch?v=VIDEO_ID
DATE: [TODAY'S DATE]

KEY TOPICS:
- [topic 1]
- [topic 2]
- [topic 3]

SUGGESTED SLUG: YYYY-MM-DD-kebab-case-title

SUGGESTED CATEGORIES: ['tag1', 'tag2', 'tag3']

CONTENT BRIEF:
[2–3 paragraph summary of what the video covers, written as a blog author would introduce it]

TRANSCRIPT CONTEXT:
[Paste the full transcript or the most relevant 2000–3000 word excerpt]

STRUCTURE:
- Intro: Hook the reader with the problem/opportunity the video addresses
- [Section per key concept]
- Code examples if the video demonstrates code
- Practical takeaways
- Attribution: Credit the original video and creator at the end

ATTRIBUTION FOOTER (include verbatim):
> This post is based on learnings from "[TITLE]" by [AUTHOR]. Watch the original video [here](https://www.youtube.com/watch?v=VIDEO_ID).
```

## Frontmatter Reference

The blog-post-manager will create the file, but confirm these fields are included:

| Field | Format | Example |
|-------|--------|---------|
| `title` | String | `"Understanding MCP Servers"` |
| `slug` | `YYYY-MM-DD-kebab-title` | `2026-06-07-mcp-servers` |
| `description` | 140–160 chars | One-sentence summary |
| `categories` | Array of strings | `['mcp', 'ai-agents']` |
| `published` | ISO 8601 | `2026-06-07T00:00:00.000Z` |
| `author` | String | `"Dale Nguyen"` |
| `coverImage` | Full URL | `https://dalenguyen.me/assets/images/blog/slug.png` |
| `profileImage` | Relative path | `assets/images/dale-nguyen-avatar.webp` |

## Common Issues

| Problem | Fix |
|---------|-----|
| `TranscriptsDisabled` error | Video has no captions — try yt-dlp with `--write-auto-sub` |
| `youtube-transcript-api` not installed | Run `pip install youtube-transcript-api` |
| Transcript is too long (>5000 words) | Summarize by keeping intro, each section header + first paragraph, and conclusion |
| Private video / members-only | Cannot extract transcript; ask user to paste it manually |
| oEmbed returns 404 | Video may be private or deleted; verify URL first |
