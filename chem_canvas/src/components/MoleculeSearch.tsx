import { useState } from 'react';
import { Search, X, Loader2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { getMoleculeByName, get2DStructureUrl, getMolViewUrl, type MoleculeData } from '../services/pubchemService';

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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a molecule name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMoleculeData(null);

    try {
      console.log(`Searching for molecule: ${searchTerm}`);
      const data = await getMoleculeByName(searchTerm);
      
      if (data) {
        setMoleculeData(data);
        // Add to search history
        if (!searchHistory.includes(searchTerm)) {
          setSearchHistory([searchTerm, ...searchHistory].slice(0, 5));
        }
        setError(null);
      } else {
        setError(`Molecule "${searchTerm}" not found in PubChem database. Try another name.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search molecule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInsertMolecule = () => {
    if (moleculeData && onSelectMolecule) {
      // Pass complete molecule data for canvas insertion
      const moleculeObject = {
        name: moleculeData.name,
        cid: moleculeData.cid,
        formula: moleculeData.molecularFormula,
        weight: moleculeData.molecularWeight,
        svgUrl: moleculeData.svgUrl,
        svgData: moleculeData.svgData,
        smiles: moleculeData.smiles,
      };
      
      onSelectMolecule(moleculeObject);
      setMoleculeData(null);
      setSearchTerm('');
      if (onClose) onClose();
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
  };

  const handleView3D = () => {
    if (moleculeData) {
      const molViewUrl = getMolViewUrl(moleculeData.cid, 'balls');
      window.open(molViewUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">Search Molecules</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-1 rounded transition"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Molecule Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., benzene, glucose, caffeine, water..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition"
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
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && !moleculeData && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Recent Searches</label>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleHistoryClick(term)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full text-sm transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-900/30 border border-red-600/50 rounded-lg">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Molecule Details */}
          {moleculeData && (
            <div className="space-y-4 border border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-white">{moleculeData.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Molecular Formula</p>
                      <p className="text-cyan-400 font-mono">{moleculeData.molecularFormula}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Molecular Weight</p>
                      <p className="text-cyan-400 font-mono">{moleculeData.molecularWeight.toFixed(2)} g/mol</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">SMILES</p>
                      <p className="text-cyan-400 font-mono text-xs break-all">{moleculeData.smiles}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">PubChem CID</p>
                      <p className="text-cyan-400 font-mono">{moleculeData.cid}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2D Structure Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-300">2D Structure</p>
                  <button
                    onClick={handleView3D}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs flex items-center gap-2 transition"
                    title="View 3D structure in MolView"
                  >
                    <Eye size={14} />
                    View 3D
                  </button>
                </div>
                {moleculeData.svgData ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: moleculeData.svgData }}
                    className="bg-white p-2 rounded border border-slate-600 flex justify-center"
                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                  />
                ) : (
                  <img
                    src={get2DStructureUrl(moleculeData.cid, 500)}
                    alt={moleculeData.name}
                    className="bg-white p-2 rounded border border-slate-600 w-full max-h-80 object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      console.error('Failed to load structure image');
                    }}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleInsertMolecule}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle size={20} />
                  Insert into Canvas
                </button>
              </div>
            </div>
          )}

          {/* Tips */}
          {!moleculeData && !error && (
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-300">💡 Tips:</p>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Try common molecule names: benzene, glucose, caffeine, water, ethanol</li>
                <li>Use IUPAC names for more specific results</li>
                <li>Results include molecular formula, weight, and 2D structure</li>
                <li>Click "View 3D" to see the 3D structure in MolView</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
