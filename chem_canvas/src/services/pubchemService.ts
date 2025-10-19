// PubChem API Service for fetching molecule structures
// Documentation: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov';
const PUBCHEM_REST_URL = `${PUBCHEM_BASE_URL}/rest/v1`;
const PUBCHEM_PUG_URL = `${PUBCHEM_BASE_URL}/rest/pug`;

export interface MoleculeData {
  name: string;
  cid: number;
  molecularFormula: string;
  molecularWeight: number;
  svgUrl: string;
  svgData?: string;
  smiles: string;
  sdfData?: string; // Add SDF data field
}

// Helper function for API calls with retry logic
const fetchWithRetry = async (url: string, retries = 3): Promise<Response | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status === 429) {
        // Rate limiting - wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      if (i === retries - 1) return response; // Return final response
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  return null;
};

// Search for molecule by name using PubChem PUG REST API
export const searchMolecule = async (moleculeName: string): Promise<number | null> => {
  try {
    console.log(`🔍 Searching PubChem for: ${moleculeName}`);
    
    // Method 1: Try using PUG REST API compound name search
    // Endpoint: /rest/v1/compound/name/{name}/cids/JSON
    const url = `${PUBCHEM_REST_URL}/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`;
    
    let response = await fetchWithRetry(url);
    
    if (response && response.ok) {
      try {
        const data = await response.json();
        if (data.IdentifierList?.CID && data.IdentifierList.CID.length > 0) {
          const cid = data.IdentifierList.CID[0];
          console.log(`✅ Found CID: ${cid} for ${moleculeName} (Method 1: REST API)`);
          return cid;
        }
      } catch (parseError) {
        console.warn(`⚠️ Error parsing JSON response:`, parseError);
      }
    }

    // Method 2: Try exact compound search with formula
    console.log(`⚠️ Method 1 failed, trying Method 2 with exact search...`);
    const formulaUrl = `${PUBCHEM_REST_URL}/compound/name/${encodeURIComponent(moleculeName)}/property/MolecularFormula/JSON`;
    
    response = await fetchWithRetry(formulaUrl);
    if (response && response.ok) {
      try {
        const data = await response.json();
        if (data.properties && data.properties.length > 0) {
          const cid = data.properties[0].CID;
          console.log(`✅ Found CID: ${cid} for ${moleculeName} (Method 2: Property search)`);
          return cid;
        }
      } catch (parseError) {
        console.warn(`⚠️ Method 2 parse error:`, parseError);
      }
    }

    // Method 3: Try with common molecule aliases
    console.log(`⚠️ Method 2 failed, trying Method 3 with common names...`);
    const commonNames: Record<string, number> = {
      'methane': 297,
      'ethane': 6324,
      'propane': 6334,
      'butane': 7843,
      'ethene': 6325,
      'ethyne': 6326,
      'benzene': 241,
      'water': 962,
      'hydrogen': 783,
      'oxygen': 977,
      'carbon dioxide': 280,
      'co2': 280,
      'methanol': 887,
      'ethanol': 702,
      'acetone': 180,
      'glucose': 5793,
      'caffeine': 2519,
      'aspirin': 2244,
    };

    const lowerName = moleculeName.toLowerCase().trim();
    if (commonNames[lowerName]) {
      const cid = commonNames[lowerName];
      console.log(`✅ Found CID: ${cid} for ${moleculeName} (Method 3: Common names)`);
      return cid;
    }

    console.warn(`❌ No CID found for "${moleculeName}" in any search method`);
    return null;
  } catch (error) {
    console.error('❌ Error searching molecule:', error);
    return null;
  }
};

// Fetch detailed molecule information by CID using PUG REST API
export const fetchMoleculeStructure = async (cid: number): Promise<MoleculeData | null> => {
  try {
    console.log(`📋 Fetching properties for CID: ${cid}`);
    
    // Common molecule names mapping for CID
    const cidToName: Record<number, string> = {
      297: 'methane',
      6324: 'ethane',
      241: 'benzene',
      962: 'water',
      783: 'hydrogen',
      977: 'oxygen',
      887: 'methanol',
      702: 'ethanol',
      180: 'acetone',
      5793: 'glucose',
      2519: 'caffeine',
      2244: 'aspirin',
      280: 'carbon dioxide',
      6325: 'ethene',
      6326: 'ethyne',
      6334: 'propane',
      7843: 'butane',
    };

    // Use PUG REST API for compound properties
    // Endpoint: /rest/pug/compound/CID/{cid}/property/{properties}/JSON
    const propertiesUrl = `${PUBCHEM_PUG_URL}/compound/CID/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;
    
    const propsResponse = await fetchWithRetry(propertiesUrl);

    let moleculeData: MoleculeData = {
      name: cidToName[cid] || `Compound ${cid}`,
      cid: cid,
      molecularFormula: 'Unknown',
      molecularWeight: 0,
      smiles: '',
      svgUrl: `${PUBCHEM_PUG_URL}/compound/CID/${cid}/PNG?image_size=400x400`,
    };

    // Try to get properties from API
    if (propsResponse && propsResponse.ok) {
      try {
    const propsData = await propsResponse.json();
    const properties = propsData.properties?.[0];

        if (properties) {
          moleculeData.name = properties.IUPACName || moleculeData.name;
          moleculeData.molecularFormula = properties.MolecularFormula || 'Unknown';
          moleculeData.molecularWeight = properties.MolecularWeight || 0;
          moleculeData.smiles = properties.CanonicalSMILES || '';
          
          console.log(`📊 Fetched properties for ${moleculeData.name}: ${moleculeData.molecularFormula}`);
        }
      } catch (parseError) {
        console.warn(`⚠️ Error parsing properties, using defaults:`, parseError);
      }
    } else {
      console.warn(`⚠️ Could not fetch properties from API, using default data for CID ${cid}`);
    }

    // Fetch SVG structure data asynchronously
    // Use PUG REST API: /rest/pug/compound/CID/{cid}/SVG
    try {
      const svgUrl = `${PUBCHEM_PUG_URL}/compound/CID/${cid}/SVG`;
      const svgResponse = await fetchWithRetry(svgUrl);
      
      if (svgResponse && svgResponse.ok) {
        let svgText = await svgResponse.text();
        if (svgText && svgText.includes('<svg')) {
          // Remove white background from SVG
          // Replace any white fill or rect with white background
          svgText = svgText
            .replace(/\sfill="white"/gi, '')  // Remove white fill attributes
            .replace(/\bfill="fff"/gi, '')    // Remove #fff fills
            .replace(/\bfill="#ffffff"/gi, '') // Remove #ffffff fills
            .replace(/\bfill="#fff"/gi, '')    // Remove #fff fills
            .replace(/<rect[^>]*width="100%"[^>]*height="100%"[^>]*fill="white"[^>]*>/gi, '') // Remove white background rects
            .replace(/<rect[^>]*fill="white"[^>]*width="100%"[^>]*height="100%"[^>]*>/gi, '') // Alternative order
            .replace(/background-color:\s*white/gi, '')
            .replace(/background-color:\s*#ffffff/gi, '')
            .replace(/background-color:\s*#fff/gi, '');
          
          // Ensure SVG has transparent background
          if (!svgText.includes('background')) {
            svgText = svgText.replace('<svg', '<svg style="background: transparent"');
          }
          
          moleculeData.svgData = svgText;
          console.log(`✅ Retrieved SVG structure for ${moleculeData.name} (with transparent background)`);
        }
      } else {
        console.warn(`⚠️ SVG not available for CID ${cid}, will use PNG fallback`);
      }
    } catch (svgError) {
      console.warn(`⚠️ Error fetching SVG: ${svgError}. Will use PNG as fallback.`);
    }

    // Fetch SDF (Structure Data Format) for 2D structure rendering
    try {
      const sdfData = await fetchSDF(cid);
      if (sdfData) {
        moleculeData.sdfData = sdfData;
        console.log(`✅ Retrieved SDF data for ${moleculeData.name}`);
      }
    } catch (sdfError) {
      console.warn(`⚠️ Error fetching SDF: ${sdfError}`);
    }

    console.log(`✅ Successfully created molecule data for CID ${cid}: ${moleculeData.name}`);
    return moleculeData;
  } catch (error) {
    console.error(`❌ Error fetching molecule structure for CID ${cid}:`, error);
    return null;
  }
};

// Get 2D structure image URL (PNG format) using PUG REST API
// Endpoint: /rest/pug/compound/CID/{cid}/PNG
export const get2DStructureUrl = (cid: number, imageSize: number = 400): string => {
  return `${PUBCHEM_PUG_URL}/compound/CID/${cid}/PNG?image_size=${imageSize}x${imageSize}`;
};

// Get high-quality 2D structure PNG by CID with blob conversion
export const get2DStructurePNG = async (cid: number, imageSize: number = 500): Promise<string | null> => {
  try {
    const url = get2DStructureUrl(cid, imageSize);
    console.log(`🖼️ Fetching PNG structure from: ${url}`);
    
    const response = await fetchWithRetry(url);
    
    if (response && response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      console.log(`✅ Successfully created blob URL for PNG`);
      return objectUrl;
    }
    
    console.warn(`⚠️ Failed to fetch PNG for CID ${cid}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching 2D structure PNG for CID ${cid}:`, error);
    return null;
  }
};

// Fetch SVG data directly using PUG REST API
// Endpoint: /rest/pug/compound/CID/{cid}/SVG
export const getMoleculeSVG = async (cid: number): Promise<string | null> => {
  try {
    const url = `${PUBCHEM_PUG_URL}/compound/CID/${cid}/SVG`;
    console.log(`🎨 Fetching SVG from: ${url}`);
    
    const response = await fetchWithRetry(url);

    if (response && response.ok) {
      const svgText = await response.text();
      if (svgText && svgText.includes('<svg')) {
        console.log(`✅ Successfully retrieved SVG for CID ${cid}`);
        return svgText;
      }
    }
    
    console.warn(`⚠️ Failed to fetch SVG for CID ${cid}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching SVG for CID ${cid}:`, error);
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

// Main function: Fetch molecule by name (combined search + structure fetch)
export const getMoleculeByName = async (moleculeName: string): Promise<MoleculeData | null> => {
  try {
    console.log(`\n🧪 === Fetching molecule: ${moleculeName} ===`);
    
    // Quick lookup for common molecules FIRST
    const commonMolecules: Record<string, number> = {
      'methane': 297,
      'ethane': 6324,
      'propane': 6334,
      'butane': 7843,
      'ethene': 6325,
      'ethyne': 6326,
      'benzene': 241,
      'water': 962,
      'hydrogen': 783,
      'oxygen': 977,
      'carbon dioxide': 280,
      'co2': 280,
      'methanol': 887,
      'ethanol': 702,
      'acetone': 180,
      'glucose': 5793,
      'caffeine': 2519,
      'aspirin': 2244,
    };

    const lowerName = moleculeName.toLowerCase().trim();
    let cid: number | null = commonMolecules[lowerName] || null;

    // If not in common list, try searching
    if (!cid) {
      console.log(`📍 Not in common molecules list, searching PubChem...`);
      cid = await searchMolecule(moleculeName);
    } else {
      console.log(`✅ Found in common molecules: CID ${cid}`);
    }
    
    if (!cid) {
      console.error(`❌ Molecule "${moleculeName}" not found in PubChem database`);
      return null;
    }
    
    // Step 2: Fetch structure and properties by CID
    const moleculeData = await fetchMoleculeStructure(cid);
    
    if (!moleculeData) {
      console.error(`❌ Failed to fetch structure for CID ${cid}`);
      return null;
    }
    
    console.log(`✅ Successfully retrieved molecule data:\n  Name: ${moleculeData.name}\n  Formula: ${moleculeData.molecularFormula}\n  Weight: ${moleculeData.molecularWeight}`);
    return moleculeData;
  } catch (error) {
    console.error(`❌ Error getting molecule by name "${moleculeName}":`, error);
    return null;
  }
};

// Alternative: Fetch molecule by CID directly
export const getMoleculeByCID = async (cid: number): Promise<MoleculeData | null> => {
  try {
    console.log(`\n🧪 === Fetching molecule with CID: ${cid} ===`);
    
    const moleculeData = await fetchMoleculeStructure(cid);
    
    if (!moleculeData) {
      console.error(`❌ Failed to fetch molecule data for CID ${cid}`);
      return null;
    }
    
    console.log(`✅ Successfully retrieved molecule: ${moleculeData.name}`);
    return moleculeData;
  } catch (error) {
    console.error(`❌ Error fetching molecule by CID ${cid}:`, error);
    return null;
  }
};

// Interface for parsed SDF atom data
export interface AtomData {
  x: number;
  y: number;
  z: number;
  element: string;
  charge: number;
}

// Interface for parsed SDF bond data
export interface BondData {
  from: number;
  to: number;
  type: number; // 1=single, 2=double, 3=triple, 4=aromatic
}

// Interface for complete parsed SDF
export interface ParsedSDF {
  atoms: AtomData[];
  bonds: BondData[];
  moleculeName: string;
}

// Fetch SDF (Structure Data Format) from PubChem
export const fetchSDF = async (cid: number): Promise<string | null> => {
  try {
    const sdfUrl = `${PUBCHEM_PUG_URL}/compound/CID/${cid}/SDF?record_type=2d`;
    console.log(`📊 Fetching SDF for CID ${cid}...`);
    
    const response = await fetchWithRetry(sdfUrl);
    if (response && response.ok) {
      const sdfText = await response.text();
      console.log(`✅ SDF fetched successfully for CID ${cid}`);
      return sdfText;
    }
    console.warn(`⚠️ Could not fetch SDF for CID ${cid}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching SDF:`, error);
    return null;
  }
};

// Parse SDF format string into structured data
export const parseSDF = (sdfText: string): ParsedSDF | null => {
  try {
    const lines = sdfText.split('\n');
    if (lines.length < 4) return null;

    const atoms: AtomData[] = [];
    const bonds: BondData[] = [];

    // Read header line (line 0-2 are header info)
    // Line 3 contains counts: atoms, bonds
    const countsLine = lines[3].split(/\s+/);
    const atomCount = parseInt(countsLine[0]);
    const bondCount = parseInt(countsLine[1]);

    // Parse atoms (starting at line 4)
    for (let i = 0; i < atomCount && (4 + i) < lines.length; i++) {
      const atomLine = lines[4 + i];
      const parts = atomLine.split(/\s+/);
      
      if (parts.length >= 4) {
        atoms.push({
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1]),
          z: parseFloat(parts[2]),
          element: parts[3],
          charge: 0,
        });
      }
    }

    // Parse bonds (starting after atoms)
    const bondsStartLine = 4 + atomCount;
    for (let i = 0; i < bondCount && (bondsStartLine + i) < lines.length; i++) {
      const bondLine = lines[bondsStartLine + i];
      const parts = bondLine.split(/\s+/);
      
      if (parts.length >= 3) {
        bonds.push({
          from: parseInt(parts[0]) - 1, // Convert to 0-based index
          to: parseInt(parts[1]) - 1,
          type: parseInt(parts[2]),
        });
      }
    }

    // Extract molecule name from line after bonds (usually line > bondsStartLine + bondCount)
    let moleculeName = 'Unknown';
    for (let i = bondsStartLine + bondCount; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('>') && !line.includes('M  ') && line.length < 100) {
        moleculeName = line;
        break;
      }
    }

    console.log(`✅ Parsed SDF: ${atomCount} atoms, ${bondCount} bonds`);
    return { atoms, bonds, moleculeName };
  } catch (error) {
    console.error(`❌ Error parsing SDF:`, error);
    return null;
  }
};

// Draw 2D structure on canvas from parsed SDF
export const drawSDF2DStructure = (
  ctx: CanvasRenderingContext2D,
  parsedSDF: ParsedSDF,
  centerX: number,
  centerY: number,
  scale: number = 30
) => {
  if (!parsedSDF.atoms || parsedSDF.atoms.length === 0) return;

  // Find bounds of the structure
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  parsedSDF.atoms.forEach(atom => {
    minX = Math.min(minX, atom.x);
    maxX = Math.max(maxX, atom.x);
    minY = Math.min(minY, atom.y);
    maxY = Math.max(maxY, atom.y);
  });

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const adjustedScale = Math.min(scale, 20 / Math.max(width, height));

  // Draw bonds first (so they appear behind atoms)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  parsedSDF.bonds.forEach(bond => {
    const atom1 = parsedSDF.atoms[bond.from];
    const atom2 = parsedSDF.atoms[bond.to];

    if (atom1 && atom2) {
      const x1 = centerX + (atom1.x - minX - width / 2) * adjustedScale;
      const y1 = centerY + (atom1.y - minY - height / 2) * adjustedScale;
      const x2 = centerX + (atom2.x - minX - width / 2) * adjustedScale;
      const y2 = centerY + (atom2.y - minY - height / 2) * adjustedScale;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw double/triple bonds
      if (bond.type === 2 || bond.type === 3) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (-dy / len) * 4;
        const offsetY = (dx / len) * 4;

        ctx.beginPath();
        ctx.moveTo(x1 + offsetX, y1 + offsetY);
        ctx.lineTo(x2 + offsetX, y2 + offsetY);
        ctx.stroke();

        if (bond.type === 3) {
          ctx.beginPath();
          ctx.moveTo(x1 - offsetX, y1 - offsetY);
          ctx.lineTo(x2 - offsetX, y2 - offsetY);
          ctx.stroke();
        }
      }
    }
  });

  // Draw atoms
  const atomColors: { [key: string]: string } = {
    'C': '#ffffff',
    'H': '#cccccc',
    'N': '#3b82f6',
    'O': '#ef4444',
    'S': '#fbbf24',
    'P': '#8b5cf6',
    'Cl': '#10b981',
    'Br': '#d946a6',
    'F': '#14b8a6',
    'I': '#8b5cf6',
  };

  parsedSDF.atoms.forEach(atom => {
    const x = centerX + (atom.x - minX - width / 2) * adjustedScale;
    const y = centerY + (atom.y - minY - height / 2) * adjustedScale;
    const radius = 5;

    // Draw atom circle
    const color = atomColors[atom.element] || '#cccccc';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw atom border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw element symbol (for non-hydrogen)
    if (atom.element !== 'H' || false) { // Skip H labels for cleaner view
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.element, x, y);
    }
  });
};