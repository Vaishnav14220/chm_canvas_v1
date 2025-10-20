import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
let genAI: GoogleGenerativeAI | null = null;
let cachedModelName: string | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

export const isGeminiInitialized = () => {
  return genAI !== null;
};

// Helper function to get the best available model
const getAvailableModel = async (genAI: GoogleGenerativeAI) => {
  // Return cached model if available
  if (cachedModelName) {
    return cachedModelName;
  }

  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      // Try a simple test to see if the model works
      const testResult = await model.generateContent('test');
      await testResult.response;
      console.log(`✅ Using model: ${modelName}`);
      cachedModelName = modelName; // Cache the working model
      return modelName;
    } catch (error: any) {
      console.warn(`❌ Model ${modelName} not available:`, error.message);
      continue;
    }
  }
  
  throw new Error('No working Gemini model found. Please check your API key and internet connection.');
};

export const generateTextContent = async (prompt: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

export const streamTextContent = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    let fullText = '';

    for await (const response of result.stream) {
      const chunk = response.text();
      if (chunk) {
        fullText += chunk;
        onChunk(chunk);
      }
    }

    return fullText;
  } catch (error) {
    console.error('Error streaming content:', error);
    throw error;
  }
};

export const generateImageDescription = async (imageUrl: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Describe what kind of image would be suitable for this URL: ${imageUrl}. Provide a brief, professional description.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating image description:', error);
    throw error;
  }
};

export const generateListItems = async (topic: string, count: number = 5): Promise<string[]> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Generate ${count} concise bullet points about: ${topic}. Return only the bullet points, one per line, without bullet symbols.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.split('\n').filter(line => line.trim().length > 0).slice(0, count);
  } catch (error) {
    console.error('Error generating list items:', error);
    throw error;
  }
};

export const generateCode = async (language: string, description: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Generate ${language} code for: ${description}. Return only the code without explanation or markdown formatting.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};

export const generateQuote = async (topic: string): Promise<{ quote: string; author: string }> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Provide an inspiring or educational quote related to: ${topic}. Format as: "Quote text" - Author Name`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse quote and author
    const match = text.match(/"([^"]+)"\s*-\s*(.+)/);
    if (match) {
      return { quote: match[1], author: match[2].trim() };
    }
    return { quote: text, author: 'Unknown' };
  } catch (error) {
    console.error('Error generating quote:', error);
    throw error;
  }
};

export const generateFormula = async (topic: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Provide a relevant mathematical or chemical formula for: ${topic}. Return only the formula without explanation.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating formula:', error);
    throw error;
  }
};

export const compileDocumentOutput = async (blocks: any[]): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please provide an API key.');
  }

  try {
    const modelName = await getAvailableModel(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Create a structured representation of the document
    let documentStructure = 'Document contains the following blocks:\n\n';
    blocks.forEach((block, index) => {
      documentStructure += `Block ${index + 1} (${block.type}):\n`;
      switch (block.type) {
        case 'textNode':
          documentStructure += `Text: ${block.data.content || 'Empty'}\n\n`;
          break;
        case 'imageNode':
          documentStructure += `Image URL: ${block.data.imageUrl || 'No URL'}\n\n`;
          break;
        case 'listNode':
          documentStructure += `List items:\n${(block.data.items || []).map((item: string) => `- ${item}`).join('\n')}\n\n`;
          break;
        case 'tableNode':
          documentStructure += `Table data:\n${(block.data.tableData || []).map((row: string[]) => row.join(' | ')).join('\n')}\n\n`;
          break;
        case 'quoteNode':
          documentStructure += `Quote: "${block.data.quote || ''}" - ${block.data.author || ''}\n\n`;
          break;
        case 'codeNode':
          documentStructure += `Code (${block.data.language || 'javascript'}):\n${block.data.code || ''}\n\n`;
          break;
        case 'formulaNode':
          documentStructure += `Formula: ${block.data.formula || ''}\n\n`;
          break;
      }
    });

    const prompt = `You are a professional document compiler. Based on the following document blocks, create a cohesive, well-formatted markdown document output. Use proper markdown formatting including headers, lists, code blocks, and emphasis. Maintain the structure and order of blocks, but enhance the presentation and add smooth transitions between sections where appropriate. Format it as professional markdown:\n\n${documentStructure}\n\nGenerate the final compiled markdown document:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error compiling document:', error);
    throw error;
  }
};

export const getApiKey = (): string | null => {
  return localStorage.getItem('gemini_api_key');
};

export const setApiKey = (apiKey: string): void => {
  localStorage.setItem('gemini_api_key', apiKey);
  cachedModelName = null; // Clear cached model when new key is set
  initializeGemini(apiKey);
};

// Initialize with the provided API key
export const initializeWithProvidedKey = (): void => {
  const providedApiKey = 'AIzaSyDCU9K42G7wKxgszFe-1UeT7rtU0WeST8s';
  setApiKey(providedApiKey);
};

export const removeApiKey = (): void => {
  localStorage.removeItem('gemini_api_key');
  genAI = null;
  cachedModelName = null; // Clear cached model
};

// Auto-initialize from localStorage on module load
const savedApiKey = getApiKey();
if (savedApiKey) {
  initializeGemini(savedApiKey);
  console.log('✅ Gemini API initialized successfully!');
} else {
  console.log(
    '%c🤖 Gemini 2.0 AI Features Available!',
    'color: #8b5cf6; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cTo enable AI-powered features:',
    'color: #6366f1; font-size: 14px;'
  );
  console.log('1. Get your free API key: https://makersuite.google.com/app/apikey');
  console.log('2. Open Document Designer → Click Settings button');
  console.log('3. Paste your API key and save');
  console.log('4. Start using Gemini 2.0 AI features! 🚀');
}

