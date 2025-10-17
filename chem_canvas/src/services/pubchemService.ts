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
    // Use the correct PubChem search endpoint
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/cgi-bin/autocomplete.cgi?input=${encodeURIComponent(moleculeName)}&type=compound&max_results=10`
    );
    
    if (!response.ok) {
      console.warn(`Molecule "${moleculeName}" not found - trying alternative search`);
      // Try direct name search as fallback
      const fallbackResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/v1/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`
      );
      
      if (!fallbackResponse.ok) {
        console.warn(`Molecule "${moleculeName}" not found in PubChem`);
        return null;
      }
      
      const data = await fallbackResponse.json();
      if (data.IdentifierList?.CID && data.IdentifierList.CID.length > 0) {
        return data.IdentifierList.CID[0];
      }
      return null;
    }
    
    const data = await response.json();
    if (data?.PC_CompoundIDL?.CID && data.PC_CompoundIDL.CID.length > 0) {
      return data.PC_CompoundIDL.CID[0];
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
    // Fetch molecule properties using the property endpoint
    const propsResponse = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`
    );

    if (!propsResponse.ok) {
      console.error('Failed to fetch molecule properties from PubChem');
      return null;
    }

    const propsData = await propsResponse.json();
    const properties = propsData.properties?.[0];

    if (!properties) {
      console.warn(`No properties found for CID ${cid}`);
      return null;
    }

    // Build the molecule data object
    const moleculeData: MoleculeData = {
      name: properties.IUPACName || `Compound ${cid}`,
      cid: cid,
      molecularFormula: properties.MolecularFormula || 'Unknown',
      molecularWeight: properties.MolecularWeight || 0,
      smiles: properties.CanonicalSMILES || '',
      svgUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/PNG?image_size=400x400`,
    };

    // Try to fetch SVG data
    try {
      const svgResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/SVG`
      );
      
      if (svgResponse.ok) {
        moleculeData.svgData = await svgResponse.text();
        console.log(`✅ Retrieved SVG for ${moleculeData.name}`);
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

// Fetch 2D structure image URLs by CID (similar to MolView for 3D)
export const get2DStructureUrl = (cid: number, imageSize: number = 400): string => {
  // PNG format
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/PNG?image_size=${imageSize}x${imageSize}`;
};

// Get high-quality 2D structure PNG by CID
export const get2DStructurePNG = async (cid: number, imageSize: number = 500): Promise<string | null> => {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/PNG?image_size=${imageSize}x${imageSize}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error('Error fetching 2D structure PNG:', error);
    return null;
  }
};

// Fetch SVG data for a molecule
export const getMoleculeSVG = async (cid: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/SVG`
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

// Create MolView embed URL using CID (for 3D structures)
export const getMolViewUrl = (cid: number, mode: string = 'balls'): string => {
  return `https://embed.molview.org/v1/?mode=${mode}&cid=${cid}`;
};

// Create MolView URL using SMILES (alternative method)
export const getMolViewUrlFromSmiles = (smiles: string, mode: string = 'balls'): string => {
  return `https://embed.molview.org/v1/?mode=${mode}&smiles=${encodeURIComponent(smiles)}`;
};

// Fetch molecule by name (combined search + fetch)
export const getMoleculeByName = async (moleculeName: string): Promise<MoleculeData | null> => {
  try {
    console.log(`🔍 Searching for: ${moleculeName}`);
    const cid = await searchMolecule(moleculeName);
    
    if (!cid) {
      console.warn(`❌ Molecule "${moleculeName}" not found in PubChem database`);
      return null;
    }
    
    console.log(`✅ Found CID: ${cid}`);
    const moleculeData = await fetchMoleculeStructure(cid);
    
    if (!moleculeData) {
      console.error(`Failed to fetch structure for CID ${cid}`);
      return null;
    }
    
    console.log(`✅ Retrieved molecule data: ${moleculeData.name}`);
    return moleculeData;
  } catch (error) {
    console.error('Error getting molecule by name:', error);
    return null;
  }
};

// Fetch molecule by CID directly (useful when you already have the CID)
export const getMoleculeByCID = async (cid: number): Promise<MoleculeData | null> => {
  try {
    console.log(`🔍 Fetching molecule with CID: ${cid}`);
    const moleculeData = await fetchMoleculeStructure(cid);
    
    if (!moleculeData) {
      console.error(`Failed to fetch molecule data for CID ${cid}`);
      return null;
    }
    
    console.log(`✅ Retrieved molecule: ${moleculeData.name}`);
    return moleculeData;
  } catch (error) {
    console.error('Error fetching molecule by CID:', error);
    return null;
  }
};
