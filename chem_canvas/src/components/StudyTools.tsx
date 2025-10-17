import { useState } from 'react';
import { Volume2, Play, Brain, FileBarChart, Star, HelpCircle, X, Download, Copy, Share2, FileText, Upload, Edit3, Save, Trash2, Plus, Type, Bold, Italic, List, Link, Palette, MessageSquare, BookOpen } from 'lucide-react';
import { sendMessageToGemini } from '../services/gemini';
import DocumentDesigner from './DocumentDesigner';
import ChatAssistant from './ChatAssistant';
import TestSection from './TestSection';

interface StudyToolsProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContent: string;
  sourceName: string;
  toolType: 'audio' | 'video' | 'mindmap' | 'reports' | 'flashcards' | 'quiz' | 'notes' | 'documents' | 'designer' | 'chat' | 'tests';
}

interface StudyContent {
  title: string;
  content: string;
  type: string;
  generated: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  modifiedAt: Date;
}

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export default function StudyTools({ isOpen, onClose, sourceContent, sourceName, toolType }: StudyToolsProps) {
  const [activeTab, setActiveTab] = useState<'study' | 'documents' | 'notes' | 'designer'>('study');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [showDocumentDesigner, setShowDocumentDesigner] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [showTestSection, setShowTestSection] = useState(false);

  const generateStudyContent = async () => {
    if (!sourceContent.trim()) {
      setError('No source content available to generate study materials.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let prompt = '';
      const basePrompt = `Based on the following source content from "${sourceName}", generate study materials. Source content:\n\n${sourceContent.substring(0, 4000)}\n\n`;

      switch (toolType) {
        case 'audio':
          prompt = basePrompt + `Create a comprehensive audio script summary that covers:
- Key concepts and main topics
- Important definitions and formulas
- Practical applications and examples
- Key takeaways for study
Format as a conversational audio script that would be engaging to listen to.`;
          break;
        case 'video':
          prompt = basePrompt + `Create a video script outline that covers:
- Introduction and overview
- Main concepts with visual descriptions
- Step-by-step explanations
- Examples and demonstrations
- Summary and key points
Format as a video script with timing cues and visual descriptions.`;
          break;
        case 'mindmap':
          prompt = basePrompt + `Create a mind map structure that shows:
- Central topic and main branches
- Sub-topics and concepts
- Relationships between ideas
- Key terms and definitions
Format as a hierarchical structure that can be visualized as a mind map.`;
          break;
        case 'reports':
          prompt = basePrompt + `Generate a detailed analytical report including:
- Executive summary
- Key findings and insights
- Detailed analysis of concepts
- Supporting evidence and examples
- Conclusions and recommendations
Format as a professional academic report.`;
          break;
        case 'flashcards':
          prompt = basePrompt + `Create study flashcards covering:
- Key terms and definitions
- Important concepts and explanations
- Formulas and equations
- Examples and applications
- Quick facts and trivia
Format each as Question: [question] Answer: [answer]`;
          break;
        case 'quiz':
          prompt = basePrompt + `Generate a comprehensive quiz with:
- Multiple choice questions (5-10)
- True/False questions (3-5)
- Short answer questions (2-3)
- Application-based questions (2-3)
Include correct answers and explanations for each question.`;
          break;
      }

      const response = await sendMessageToGemini(prompt);
      
      setStudyContent({
        title: `${getToolDisplayName(toolType)} - ${sourceName}`,
        content: response,
        type: toolType,
        generated: true
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate study content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const content = await file.text();
      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        content: content,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      };
      
      setUploadedDocuments(prev => [...prev, newDocument]);
    } catch (error) {
      setError('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    setNotes(prev => [...prev, newNote]);
    setSelectedNote(newNote);
    setNoteTitle('New Note');
    setNoteContent('');
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    const updatedNote: Note = {
      ...selectedNote,
      title: noteTitle,
      content: noteContent,
      modifiedAt: new Date()
    };
    
    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    
    setSelectedNote(updatedNote);
    setIsEditing(false);
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const getToolDisplayName = (type: string) => {
    const names = {
      audio: 'Audio Overview',
      video: 'Video Overview',
      mindmap: 'Mind Map',
      reports: 'Reports',
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      notes: 'Custom Notes',
      documents: 'Document Manager',
      designer: 'Document Designer',
      chat: 'Chat Assistant',
      tests: 'AI Test Center'
    };
    return names[type as keyof typeof names] || type;
  };

  const getToolIcon = (type: string) => {
    const icons = {
      audio: Volume2,
      video: Play,
      mindmap: Brain,
      reports: FileBarChart,
      flashcards: Star,
      quiz: HelpCircle,
      notes: Edit3,
      documents: FileText,
      designer: Palette,
      chat: MessageSquare,
      tests: BookOpen
    };
    return icons[type as keyof typeof icons] || HelpCircle;
  };

  const copyToClipboard = () => {
    if (studyContent) {
      navigator.clipboard.writeText(studyContent.content);
    }
  };

  const downloadContent = () => {
    if (studyContent) {
      const blob = new Blob([studyContent.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studyContent.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  const Icon = getToolIcon(toolType);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-lg w-[900px] max-w-[90vw] max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{getToolDisplayName(toolType)}</h2>
              <p className="text-sm text-muted-foreground">Source: {sourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'study', label: 'Study Tools', icon: Brain },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'notes', label: 'Notes', icon: Edit3 },
              { id: 'designer', label: 'Designer', icon: Palette }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  data-tool={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap py-4 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            
            {/* Direct Access Buttons */}
            <div className="ml-auto flex items-center gap-2">
              <button
                data-tool="chat"
                onClick={() => setShowChatAssistant(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap py-2 px-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Chat Assistant
              </button>
              
              <button
                data-tool="tests"
                onClick={() => setShowTestSection(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap py-2 px-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                AI Test Center
              </button>
            </div>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Study Tools Tab */}
          {activeTab === 'study' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {!studyContent ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 mx-auto mb-4">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Generate {getToolDisplayName(toolType)}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create {getToolDisplayName(toolType).toLowerCase()} based on your source content to enhance your study experience.
                    </p>
                    
                    {error && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                        <p className="text-destructive text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={generateStudyContent}
                      disabled={isGenerating || !sourceContent.trim()}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Icon className="h-4 w-4" />
                          Generate {getToolDisplayName(toolType)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Toolbar */}
                  <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Generated Successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                      <button
                        onClick={downloadContent}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Generated Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-invert max-w-none">
                      <h1 className="text-2xl font-bold mb-4">{studyContent.title}</h1>
                      <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {studyContent.content}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6">
                {/* Quick Start Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Quick Start Guide</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Upload your documents first, then use the tools below to analyze and create content from them.
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                            <span className="text-xs font-bold">2</span>
                          </div>
                          <span className="text-green-700 font-medium">Chat with documents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                            <span className="text-xs font-bold">3</span>
                          </div>
                          <span className="text-purple-700 font-medium">Generate tests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Document Manager</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowChatAssistant(true)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-9 px-4 gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat Assistant
                    </button>
                    <button
                      onClick={() => setShowTestSection(true)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 h-9 px-4 gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      AI Test Center
                    </button>
                    <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Document'}
                      <input
                        type="file"
                        accept=".pdf,.txt,.md,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  {uploadedDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">No documents uploaded</h4>
                      <p className="text-muted-foreground">Upload your study materials to get started</p>
                    </div>
                  ) : (
                    uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{doc.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {doc.type} • {(doc.size / 1024).toFixed(1)} KB • {doc.uploadedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8">
                              <Download className="h-4 w-4" />
                            </button>
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-hidden flex">
              {/* Notes Sidebar */}
              <div className="w-64 border-r border-border bg-muted/20">
                <div className="p-4 border-b border-border">
                  <button
                    onClick={createNewNote}
                    className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Note
                  </button>
                </div>
                
                <div className="p-2">
                  {notes.length === 0 ? (
                    <div className="text-center py-8">
                      <Edit3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            setSelectedNote(note);
                            setNoteTitle(note.title);
                            setNoteContent(note.content);
                            setIsEditing(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedNote?.id === note.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <h4 className="font-medium text-sm truncate">{note.title}</h4>
                          <p className="text-xs opacity-70 truncate">{note.content.substring(0, 50)}...</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Note Editor */}
              <div className="flex-1 flex flex-col">
                {selectedNote ? (
                  <>
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        {isEditing ? (
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        ) : (
                          <h3 className="text-lg font-semibold">{selectedNote.title}</h3>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveNote}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setIsEditing(false)}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteNote(selectedNote.id)}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      {isEditing ? (
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Start writing your notes..."
                          className="w-full h-full resize-none border-none outline-none bg-transparent text-sm leading-relaxed"
                        />
                      ) : (
                        <div className="w-full h-full text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedNote.content || 'No content yet. Click edit to start writing.'}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">Select a note</h4>
                      <p className="text-muted-foreground">Choose a note from the sidebar or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Designer Tab */}
          {activeTab === 'designer' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1">
                <DocumentDesigner 
                  isOpen={true} 
                  onClose={() => setActiveTab('study')} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Generated from: {sourceName}
          </div>
          <div className="flex items-center gap-3">
            {studyContent && (
              <button
                onClick={() => {
                  setStudyContent(null);
                  setError(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Generate New
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Chat Assistant Modal */}
      <ChatAssistant 
        isOpen={showChatAssistant} 
        onClose={() => setShowChatAssistant(false)} 
      />
      
      {/* Test Section Modal */}
      <TestSection 
        isOpen={showTestSection} 
        onClose={() => setShowTestSection(false)} 
      />
    </div>
  );
}