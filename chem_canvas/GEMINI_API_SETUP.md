# Google Gemini API Setup Guide

## Quick Start

### Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Sign In**: Use your Google account to sign in
3. **Create API Key**: 
   - Click "Get API Key" or "Create API Key"
   - Select an existing Google Cloud project or create a new one
   - Copy the generated API key

### Step 2: Configure in the Application

1. **Launch the App**: Open http://localhost:1754
2. **Open Document Designer**: 
   - Click "Show Study Tools" button
   - Navigate to the "Designer" tab
3. **Configure API Key**:
   - Click the **Settings** button (orange icon in the top toolbar)
   - Paste your API key in the input field
   - Click "Save API Key"
   - The button will turn from orange to normal, indicating successful configuration

### Step 3: Use AI Features

#### AI Text Generation:
- Add a Text Block to the canvas
- Click the **purple wand icon** (🪄) in the block header
- Wait for AI to generate content
- Edit as needed

#### AI Document Compilation:
1. Create your document flow with multiple blocks
2. Connect blocks using the handles (blue input, green output)
3. Connect final blocks to the green **Output Node**
4. Click the green **Run** button in the toolbar
5. Gemini AI will intelligently compile all blocks into a cohesive document

## Features

### Available AI Functions:

1. **Text Generation** - Generate paragraphs and content
2. **List Creation** - AI-generated bullet points
3. **Code Generation** - Programming code snippets
4. **Quote Generation** - Inspirational/educational quotes
5. **Formula Generation** - Math/chemistry formulas
6. **Document Compilation** - Intelligent document assembly

## API Key Security

- Your API key is stored **locally** in your browser (localStorage)
- The key is **never sent to any server** except Google's Gemini API
- You can remove the API key anytime using the "Remove" button
- The key persists across browser sessions

## Troubleshooting

### "API Key not initialized" Error
- Make sure you've entered and saved your API key
- Check that the Settings button shows normal color (not orange)
- Try removing and re-adding the API key

### "Failed to generate content" Error
- Verify your API key is correct
- Check your internet connection
- Ensure you haven't exceeded the API quota
- Try again in a few moments

### API Quota
- Gemini API has a free tier with generous limits
- Free tier: 60 requests per minute
- For higher usage, check Google AI Studio for pricing

## Example Workflow

```
1. Get API Key from Google AI Studio
   ↓
2. Open App → Study Tools → Designer
   ↓
3. Click Settings → Enter API Key → Save
   ↓
4. Add Text Block → Click AI Wand → Get AI Content
   ↓
5. Add more blocks and connect them
   ↓
6. Connect to Output Node
   ↓
7. Click Run → Get AI-compiled document
```

## Support

For more information about Gemini API:
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Pricing](https://ai.google.dev/pricing)

## Notes

- The application uses **Gemini Pro** model
- All processing happens via Google's secure API
- No data is stored on any external servers
- Your documents and API key remain private













