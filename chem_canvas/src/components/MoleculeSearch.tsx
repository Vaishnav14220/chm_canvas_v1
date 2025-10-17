import { useState } from 'react';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { fetchMoleculeStructure, type MoleculeData } from '../services/pubchemService';

interface MoleculeSearchProps {
  onSelectMolecule?: (moleculeData: MoleculeData) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function MoleculeSearch({ onSelectMolecule, isOpen = true, onClose }: MoleculeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a molecule name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMoleculeData(null);

    try {
      const data = await fetchMoleculeStructure(searchTerm);
      
      if (data) {
        setMoleculeData(data);
        setSearchHistory(prev => [searchTerm, ...prev.filter(item => item !== searchTerm)].slice(0, 5));
        setError(null);
      } else {
        setError(`Molecule "${searchTerm}" not found. Try a different name.`);
      }
    } catch (err) {
      setError('Error fetching molecule data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertMolecule = () => {
    if (moleculeData && onSelectMolecule) {
      onSelectMolecule(moleculeData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-white">Search Molecules</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Molecule Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., benzene, glucose, caffeine, water..."
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && !moleculeData && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase">Recent Searches</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchTerm(term);
                      setSearchTerm(term);
                    }}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Molecule Results */}
          {moleculeData && (
            <div className="space-y-4 border-t border-slate-700 pt-6">
              {/* Molecule Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Name</label>
                  <p className="text-lg font-semibold text-white mt-1">{moleculeData.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">CID</label>
                  <p className="text-lg font-semibold text-primary mt-1">{moleculeData.cid}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Molecular Formula</label>
                  <p className="text-lg font-mono text-slate-300 mt-1">{moleculeData.molecularFormula}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Molecular Weight</label>
                  <p className="text-lg font-semibold text-slate-300 mt-1">{moleculeData.molecularWeight.toFixed(2)} g/mol</p>
                </div>
              </div>

              {/* 2D Structure Image */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase">2D Structure</label>
                <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                  <img
                    src={moleculeData.svgUrl}
                    alt={moleculeData.name}
                    className="max-w-full max-h-64 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="gray"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>

              {/* SMILES */}
              {moleculeData.smiles && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">SMILES</label>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <code className="text-xs text-slate-300 break-all font-mono">{moleculeData.smiles}</code>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={handleInsertMolecule}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                  Insert into Canvas
                </button>
                <button
                  onClick={() => {
                    setMoleculeData(null);
                    setSearchTerm('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Search Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
