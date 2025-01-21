# Character Creation Guide

## Structure Requirements
Each character folder must contain:
1. `manifest.json` - Character metadata
2. `character.zip` - Exported Perchance file
3. `preview.png` - Character preview image
4. `README.md` - Character documentation

## Manifest Format
```json
{
  "name": "Character Name",
  "description": "Brief description",
  "author": "Your pseudonym",
  "link": "Character's link for perchance ai-chat",
  "tags": ["tag1", "tag2"],
  "rating": "sfw/nsfw",
  "generator": "ai-character-chat",
  "downloads": "Counter of downloads",
  "version": "1.0.0",
  "last-update": "2025/01/01 00:00:00",
  "last-changes": "A brief description of what was updated in the character"
}
