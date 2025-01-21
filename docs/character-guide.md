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
  "author": "Your GitHub username",
  "tags": ["tag1", "tag2"],
  "rating": "sfw",
  "generator": "ai-character-chat",
  "version": "1.0.0"
}
