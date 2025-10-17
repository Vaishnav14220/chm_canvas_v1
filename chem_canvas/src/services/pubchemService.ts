// PubChem API Service for fetching molecule structures

export interface MoleculeData {
  name: string;
  cid: number;
  molecularFormula: string;
  molecularWeight: number;
  svgUrl: string;
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
    
    // Construct 2D structure SVG URL
    const svgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/PNG?image_size=400x400`;
    
    return {
      name: moleculeName,
      cid,
      molecularFormula,
      molecularWeight,
      svgUrl,
      smiles
    };
  } catch (error) {
    console.error('Error fetching molecule details:', error);
    return null;
  }
};

// Get 2D structure SVG directly
export const getMolecule2DSVg = async (cid: number): Promise<string | null> => {
  try {
    // Using PNG endpoint from PubChem with specified size
    return `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/CID/${cid}/PNG?image_size=500x500`;
  } catch (error) {
    console.error('Error getting molecule SVG:', error);
    return null;
  }
};

// Complete workflow: search and fetch
export const fetchMoleculeStructure = async (moleculeName: string): Promise<MoleculeData | null> => {
  try {
    const cid = await searchMolecule(moleculeName);
    if (!cid) return null;
    
    const moleculeData = await getMoleculeDetails(cid);
    return moleculeData;
  } catch (error) {
    console.error('Error in fetchMoleculeStructure:', error);
    return null;
  }
};
