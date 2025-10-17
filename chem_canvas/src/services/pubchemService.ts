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
      return data.IdentifierList.CID[0];
    }
    return null;
  } catch (error) {
    console.error('Error searching molecule:', error);
    return null;
  }
};

// Fetch detailed molecule information by CID
export const fetchMoleculeStructure = async (cid: number): Promise<MoleculeData | null> => {
  try {
    // Fetch molecule properties
    const propsResponse = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`
    );

    if (!propsResponse.ok) {
      console.error('Failed to fetch molecule properties');
      return null;
    }

    const propsData = await propsResponse.json();
    const properties = propsData.properties?.[0];

    if (!properties) return null;

    // Build the molecule data object
    const moleculeData: MoleculeData = {
      name: properties.IUPACName || `Compound ${cid}`,
      cid: cid,
      molecularFormula: properties.MolecularFormula || 'Unknown',
      molecularWeight: properties.MolecularWeight || 0,
      smiles: properties.CanonicalSMILES || '',
      svgUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/PNG?image_size=400x400`,
    };

    // Try to fetch SVG
    try {
      const svgResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/SVG`
      );
      
      if (svgResponse.ok) {
        moleculeData.svgData = await svgResponse.text();
      }
    } catch (svgError) {
      console.warn('SVG fetch failed, using PNG fallback');
    }

    return moleculeData;
  } catch (error) {
    console.error('Error fetching molecule structure:', error);
    return null;
  }
};

// Fetch SVG data for a molecule
export const getMoleculeSVG = async (cid: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/SVG`
    );

    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch (error) {
    console.error('Error fetching SVG:', error);
    return null;
  }
};

// Fetch molecule by name (combined search + fetch)
export const getMoleculeByName = async (moleculeName: string): Promise<MoleculeData | null> => {
  try {
    const cid = await searchMolecule(moleculeName);
    if (!cid) {
      console.warn(`Molecule "${moleculeName}" not found`);
      return null;
    }
    
    const moleculeData = await fetchMoleculeStructure(cid);
    return moleculeData;
  } catch (error) {
    console.error('Error getting molecule by name:', error);
    return null;
  }
};
