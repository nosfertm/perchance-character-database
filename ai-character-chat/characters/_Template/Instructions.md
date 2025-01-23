# Character Template 📝

This directory contains a template for creating and submitting characters to the database. Below you'll find details about each file and directory.

## Required Files ⭐

### `manifest.json`
Character metadata and configuration file. Contains:
- Basic information (name, description, author, avatar, chat link, etc)
- Content rating (sfw/nsfw)
- Group settings and character relationships
- Features and dependencies
- Categories and tags

### `character.zip`
The exported character file from Perchance AI Character Chat. Must be:
- Generated using the export function
- Named exactly as "character.zip"
- Unmodified after export

### `README.md`
Character documentation and usage guide. Should include:
- Character description
- Personality traits
- Usage instructions
- Special features
- Credits and attributions

## Optional Files 🔶

### `changelog.md`
Version history of the character:
- Version numbers
- Update dates
- Changes made
- Future plans

### `assets/`
Directory for additional resources:
- Reaction images
- Voice files
- Alternative images
- Background images
Recommended if your character uses custom media.

### `src/`
Decomposed character configuration files for easier maintenance:

#### `prompt.txt`
Main character prompt:
- Personality definition
- Background story
- Behavior guidelines

#### `reminder.txt`
Additional context shown in every message:
- Core traits
- Important rules
- Persistent information

#### `user-role.txt`
Definition of user's role in interaction:
- User's character
- Relationship with the AI
- Context of interaction

#### `custom-code.js`
JavaScript code for extended functionality:
- Custom features
- API integrations
- Special behaviors

## File Organization 📁
```
character-name/
├── manifest.json     # Required
├── character.zip     # Required
├── README.md        # Required
├── changelog.md     # Optional
├── assets/          # Optional
└── src/             # Optional
```

## Notes 📌

1. **Required Files**
   - Must be present for submission
   - Must follow naming conventions
   - Must meet format specifications

2. **Optional Files**
   - Include as needed
   - Help with maintenance
   - Enhance documentation

3. **Best Practices**
   - Keep files organized
   - Update changelog regularly
   - Document custom code
   - Use clear naming conventions

4. **Submission**
   - Verify all required files
   - Test before submission
   - Include proper documentation
   - Follow contribution guidelines

## Example Usage 💡

Check the `_Template` directory for a complete example with all files and proper formatting.

## Questions? 💬

- Review our [Contribution Guide](../../docs/getting-started/how-to-contribute.md)
- Join our [Discord](https://discord.gg/your-server)
- Open an [Issue](../../../../issues/new)