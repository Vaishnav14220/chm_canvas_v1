// PubChem API Service for fetching molecule structures

export interface MoleculeData {
  name: string;
  cid: number;
  molecularFormula: string;
  molecularWeight: number;
  svgUrl: string;
  svgData?: string;
  smiles: string;
}

// Search for molecule by name and get CID
export const searchMolecule = async (moleculeName: string): Promise<number | null> => {
  try {
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`
    );
    
    if (!response.ok) {
      console.warn(`Molecule "${moleculeName}" not found in PubChem`);
      return null;
    }
    
    const data = await response.json();
    if (data.IdentifierList?.CID && data.IdentifierList.CID.length > 0) {
      return data.IdentifierList.CID[0]; // Return first match
    }
    return null;
  } catch (error) {
    console.error('Error searching molecule:', error);
    return null;
  }
};

// Get molecule details from PubChem using CID
export const getMoleculeDetails = async (cid: number): Promise<MoleculeData | null> => {
  try {
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/JSON`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch molecule details for CID ${cid}`);
      return null;
    }
    
    const data = await response.json();
    const compound = data.PC_Compounds?.[0];
    
    if (!compound) {
      console.error('Invalid compound data');
      return null;
    }
    
    // Extract properties
    let molecularFormula = '';
    let molecularWeight = 0;
    let smiles = '';
    let preferredName = '';
    
    if (compound.props) {
      compound.props.forEach((prop: any) => {
        const urn = prop.urn?.label;
        const value = prop.value?.stringval || prop.value?.sval || prop.value?.fval || '';
        
        if (urn === 'Molecular Formula') molecularFormula = value;
        if (urn === 'Molecular Weight') molecularWeight = parseFloat(value);
        if (urn === 'SMILES' && prop.urn?.name === 'Canonical') smiles = value;
        if (urn === 'Preferred IUPAC Name') preferredName = value;
      });
    }
    
    // Get molecule name
    const moleculeName = compound.atoms?.name || preferredName || `Compound ${cid}`;
    
    // Construct 2D structure SVG URL (PubChem SVG endpoint)
    const svgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/record?record_type=2d&image_size=400x400`;
    const pngUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/PNG?image_size=500x500`;
    
    return {
      name: moleculeName,
      cid,
      molecularFormula,
      molecularWeight,
      svgUrl: pngUrl, // Fallback PNG for display
      smiles
    };
  } catch (error) {
    console.error('Error fetching molecule details:', error);
    return null;
  }
};

// Get 2D structure as SVG directly from PubChem
export const getMolecule2DSVG = async (cid: number): Promise<string | null> => {
  try {
    // Try to get SVG from PubChem record
    const svgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/record?record_type=2d`;
    const response = await fetch(svgUrl);
    
    if (response.ok) {
      const data = await response.json();
      // Extract SVG from record if available
      if (data.record?.atoms) {
        return generateSVGFromAtoms(data.record, cid);
      }
    }
    
    // Fallback to PNG if SVG not available
    return `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/PNG?image_size=500x500`;
  } catch (error) {
    console.error('Error getting molecule SVG:', error);
    return null;
  }
};

// Helper function to generate SVG from atom data
const generateSVGFromAtoms = (record: any, cid: number): string => {
  try {
    // Create a simple SVG representation of the molecule
    // This is a basic implementation - PubChem provides structure data
    const atoms = record.atoms || [];
    const bonds = record.bonds || [];
    
    if (atoms.length === 0) {
      // If no atoms, return empty SVG
      return createEmptySVG(cid);
    }
    
    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    atoms.forEach((atom: any) => {
      if (atom.x !== undefined) {
        minX = Math.min(minX, atom.x);
        maxX = Math.max(maxX, atom.x);
      }
      if (atom.y !== undefined) {
        minY = Math.min(minY, atom.y);
        maxY = Math.max(maxY, atom.y);
      }
    });
    
    const width = (maxX - minX) * 10 + 40;
    const height = (maxY - minY) * 10 + 40;
    
    let svg = `<svg width="400" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;
    
    // Draw bonds first
    bonds.forEach((bond: any) => {
      const atom1 = atoms[bond.aid1 - 1];
      const atom2 = atoms[bond.aid2 - 1];
      
      if (atom1 && atom2) {
        const x1 = (atom1.x - minX) * 10 + 20;
        const y1 = (atom1.y - minY) * 10 + 20;
        const x2 = (atom2.x - minX) * 10 + 20;
        const y2 = (atom2.y - minY) * 10 + 20;
        
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="2"/>`;
      }
    });
    
    // Draw atoms
    atoms.forEach((atom: any) => {
      const x = (atom.x - minX) * 10 + 20;
      const y = (atom.y - minY) * 10 + 20;
      const element = atom.label || 'C';
      
      svg += `<circle cx="${x}" cy="${y}" r="8" fill="white" stroke="black" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${y}" text-anchor="middle" dy="0.3em" font-size="10" font-weight="bold">${element}</text>`;
    });
    
    svg += `</svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    console.error('Error generating SVG:', error);
    return createEmptySVG(cid);
  }
};

// Create empty SVG placeholder
const createEmptySVG = (cid: number): string => {
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="white" stroke="#ccc" stroke-width="1"/>
    <text x="200" y="180" text-anchor="middle" font-size="14" fill="#999">2D Structure</text>
    <text x="200" y="210" text-anchor="middle" font-size="12" fill="#999">CID: ${cid}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Complete workflow: search and fetch
export const fetchMoleculeStructure = async (moleculeName: string): Promise<MoleculeData | null> => {
  try {
    const cid = await searchMolecule(moleculeName);
    if (!cid) return null;
    
    const moleculeData = await getMoleculeDetails(cid);
    if (moleculeData) {
      // Try to get SVG
      const svgUrl = await getMolecule2DSVG(cid);
      if (svgUrl) {
        moleculeData.svgUrl = svgUrl;
      }
    }
    return moleculeData;
  } catch (error) {
    console.error('Error in fetchMoleculeStructure:', error);
    return null;
  }
};
