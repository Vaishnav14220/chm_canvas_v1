import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, FileText, Copy } from 'lucide-react';
import { AIInteraction } from '../types';
import { useLLMOutput, type LLMOutputComponent } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import { findCompleteCodeBlock, findPartialCodeBlock, codeBlockLookBack } from '@llm-ui/code';
import { fetchCanonicalSmiles } from '../services/pubchemService';

interface AIChatProps {
  onSendMessage: (message: string) => Promise<void>;
  interactions: AIInteraction[];
  isLoading: boolean;
  documentName?: string;
  onOpenDocument?: () => void;
}

const SMILES_CODE_REGEX = /`([^`]+)`/g;
const SMILES_LABEL_REGEX = /SMILES[^:]*[:\-]\s*([A-Za-z0-9@+\-\[\]\(\)\\\/=#$%]+)(?=\s|$)/gi;

const extractSmilesCandidates = (text: string): string[] => {
  const results = new Set<string>();

  for (const match of text.matchAll(SMILES_CODE_REGEX)) {
    const candidate = match[1]?.trim();
    if (candidate) {
      results.add(candidate);
    }
  }

  for (const match of text.matchAll(SMILES_LABEL_REGEX)) {
    const candidate = match[1]?.trim();
    if (candidate) {
      results.add(candidate);
    }
  }

  return Array.from(results);
};

const verifySmilesList = async (candidates: string[]): Promise<string[]> => {
  const verified: string[] = [];
  for (const candidate of candidates) {
    try {
      const canonical = await fetchCanonicalSmiles(candidate);
      if (canonical) {
        verified.push(canonical);
        continue;
      }
    } catch (err) {
      console.warn('⚠️ PubChem SMILES lookup failed:', err);
    }
    // Fallback to raw candidate if canonicalization fails
    verified.push(candidate);
  }
  return Array.from(new Set(verified));
};

const VerifiedSmilesBlock = ({ sourceText }: { sourceText: string }) => {
  const [verified, setVerified] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const candidates = extractSmilesCandidates(sourceText);
    if (!candidates.length) {
      setVerified([]);
      return;
    }

    setIsChecking(true);
    verifySmilesList(candidates)
      .then(list => {
        if (isMounted) {
          setVerified(list);
        }
      })
      .catch(err => {
        console.warn('⚠️ Error verifying SMILES list:', err);
        if (isMounted) setVerified(candidates);
      })
      .finally(() => {
        if (isMounted) setIsChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sourceText]);

  if (!verified.length) {
    return null;
  }

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-blue-300 flex items-center gap-1">
        Suggested SMILES {isChecking && <Loader2 size={12} className="animate-spin text-blue-300" />}
      </p>
      {verified.map((smiles, idx) => (
        <div key={`${smiles}-${idx}`} className="flex items-center justify-between gap-2 bg-gray-800/70 rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-gray-100 break-all">{smiles}</span>
          <button
            onClick={() => navigator.clipboard.writeText(smiles)}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/40 px-2 py-1 rounded-md transition-colors"
            title="Copy SMILES"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">Copy the SMILES and paste it into NMRium's molecule input to visualize the structure.</p>
    </div>
  );
};

// Markdown component for text blocks
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const content = blockMatch.output;
  const onCitationClick = (blockMatch as any).onCitationClick;
  
  // Handle citations and other special formatting
  const parts = content.split(/(\[\[(\d+)\]\]|\[(\d+)\])/g);
  
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      {parts.map((part: string, partIndex: number) => {
        const citationMatch = part.match(/^\[\[?(\d+)\]\]?$/);
        if (citationMatch) {
          const pageNum = citationMatch[1];
          return (
            <button
              key={partIndex}
              onClick={onCitationClick}
              className="inline-flex items-center px-2 py-1 mx-1 text-xs font-medium bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors border border-blue-600/30"
            >
              📄 {pageNum}
            </button>
          );
        }
        return <span key={partIndex}>{part}</span>;
      })}
    </div>
  );
};

// Code block component
const CodeBlockComponent: LLMOutputComponent = ({ blockMatch }) => {
  const code = blockMatch.output;
  
  return (
    <div className="my-4">
      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm">{code}</code>
      </pre>
    </div>
  );
};

// LLMMessage component using llm-ui for enhanced markdown rendering
function LLMMessage({ content, onCitationClick }: { content: string; onCitationClick?: () => void }) {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlockComponent,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished: true,
  });

  return (
    <div>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        // Add onCitationClick to blockMatch for MarkdownComponent to access
        const enhancedBlockMatch = { ...blockMatch, onCitationClick };
        return <Component key={index} blockMatch={enhancedBlockMatch} />;
      })}
    </div>
  );
}

export default function AIChat({ onSendMessage, interactions, isLoading, documentName, onOpenDocument }: AIChatProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [interactions, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      try {
        await onSendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        // Don't clear the message if there was an error
      }
    }
  };

    return (
      <div className="bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-full border border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-750 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-2xl shadow-lg border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <Sparkles size={22} className="text-blue-400 animate-pulse-slow" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Chemistry AI Assistant</h2>
                <p className="text-xs text-gray-400">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>
          </div>
          
          {documentName && (
            <div className="bg-blue-900/30 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center justify-between border border-blue-700/50">
              <div className="flex items-center gap-2 text-sm">
                <FileText size={16} className="text-blue-400" />
                <span className="font-medium truncate max-w-md text-blue-200">📄 Reference: {documentName}</span>
              </div>
              <button
                onClick={onOpenDocument}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors text-white"
              >
                Open
              </button>
            </div>
          )}
        </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0 bg-gray-900">
        {documentName && interactions.length > 0 && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <FileText size={16} className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-300 mb-1">
                  📄 Document Analysis Active
                </p>
                <p className="text-xs text-green-200">
                  I'm analyzing <strong>{documentName}</strong>. Ask questions and I'll cite the exact pages!
                </p>
                <p className="text-xs text-green-400 mt-1">
                  💡 Click on citation badges to view the referenced page
                </p>
              </div>
            </div>
          </div>
        )}
        
        {interactions.length === 0 ? (
          <div className="text-center mt-12 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-600/30">
              <Sparkles size={40} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to ChemCanvas AI!</h3>
            <p className="text-gray-400 mb-1">Ask me anything about your chemistry work</p>
            <p className="text-sm text-gray-500">💡 I can help with molecules, reactions, equations, and more</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-blue-700/50 text-left hover:border-blue-600/70 transition-colors h-20 flex flex-col justify-between">
                <div className="text-blue-400 font-semibold text-sm mb-1">🧬 Example</div>
                <div className="text-xs text-gray-300">"Explain the combustion of methane (CH4)"</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-blue-700/50 text-left hover:border-blue-600/70 transition-colors h-20 flex flex-col justify-between">
                <div className="text-blue-400 font-semibold text-sm mb-1">⚗️ Example</div>
                <div className="text-xs text-gray-300">"What is the pH formula and how to calculate it?"</div>
              </div>
              {documentName ? (
                <>
                  <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-green-700/50 text-left hover:border-green-600/70 transition-colors h-20 flex flex-col justify-between">
                    <div className="text-green-400 font-semibold text-sm mb-1">📄 Ask about your document</div>
                    <div className="text-xs text-gray-300">"Summarize the key concepts from page 1"</div>
                  </div>
                  <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-green-700/50 text-left hover:border-green-600/70 transition-colors h-20 flex flex-col justify-between">
                    <div className="text-green-400 font-semibold text-sm mb-1">📄 Ask about your document</div>
                    <div className="text-xs text-gray-300">"Explain the reactions mentioned in the document"</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-blue-700/50 text-left hover:border-blue-600/70 transition-colors h-20 flex flex-col justify-between">
                    <div className="text-blue-400 font-semibold text-sm mb-1">🔬 Example</div>
                    <div className="text-xs text-gray-300">"Show me the equilibrium constant equation"</div>
                  </div>
                  <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-blue-700/50 text-left hover:border-blue-600/70 transition-colors h-20 flex flex-col justify-between">
                    <div className="text-blue-400 font-semibold text-sm mb-1">⚛️ Example</div>
                    <div className="text-xs text-gray-300">"Explain Gibbs free energy with equations"</div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-400 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700/50">
              ✨ <strong>Pro tip:</strong> {documentName ? 'I can analyze your document and provide citations!' : 'Upload a document to ask questions about it with citations!'}
            </div>
          </div>
        ) : (
          interactions.map((interaction, index) => (
            <div key={interaction.id} className="space-y-3 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-end">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 max-w-[75ch] shadow-lg break-words">
                  <p className="text-xs font-semibold mb-1 opacity-90">You</p>
                  <p className="text-sm">{interaction.prompt}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm p-4 max-w-[75ch] shadow-md border border-gray-700 space-y-3 break-words">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-1.5 rounded-lg">
                      <Sparkles size={14} className="text-blue-400" />
                    </div>
                    <p className="text-xs font-semibold text-gray-300">AI Assistant</p>
                  </div>
                  <div className="text-sm text-gray-200">
                    <LLMMessage 
                      content={interaction.response}
                      onCitationClick={onOpenDocument}
                    />
                  </div>
                  <VerifiedSmilesBlock sourceText={interaction.response || ''} />
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm p-4 shadow-md border border-gray-700">
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm rounded-b-2xl">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="💬 Ask about your chemistry work..."
            className="flex-1 px-4 py-3 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-700 text-white placeholder-gray-400 shadow-sm min-h-[48px]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="md:px-5 md:py-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
}
