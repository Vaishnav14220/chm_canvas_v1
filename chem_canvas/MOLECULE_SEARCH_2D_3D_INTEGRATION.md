# 🧬 Molecule Search: 2D & 3D Integration with CID

## Overview

The **Molecule Search** feature has been enhanced to provide seamless integration between:
- **2D Structure Display**: High-quality 2D molecular structures from PubChem
- **3D Visualization**: Interactive 3D molecular viewer via MolView
- **CID-Based Retrieval**: All data fetched using PubChem Compound ID (CID)

This creates a complete molecular visualization pipeline similar to professional chemistry software.

---

## 🎯 Key Features

### 1. **Unified CID-Based System**
- Single CID identifies the molecule across PubChem and MolView
- Consistent data retrieval for both 2D and 3D representations
- Efficient API calls using standardized endpoints

### 2. **2D Structure Display**
```typescript
// Direct URL method (like MolView):
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/{cid}/PNG?image_size=500x500

// SVG support for vector graphics:
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/{cid}/SVG
```

**Features:**
- ✅ PNG format for compatibility (400x400, 500x500, custom sizes)
- ✅ SVG format for scalable vector rendering
- ✅ Auto-fallback: SVG → PNG
- ✅ High-quality images suitable for scientific work

### 3. **3D MolView Integration**
```typescript
// MolView URL using CID:
https://embed.molview.org/v1/?mode=balls&cid={cid}

// Alternative using SMILES:
https://embed.molview.org/v1/?mode=balls&smiles={SMILES}
```

**Modes Available:**
- `balls` - Ball and stick (default)
- `sticks` - Stick model
- `spacefill` - Space-filling model
- `wireframe` - Wireframe model

### 4. **Complete Molecule Data**
Each search result provides:
- 📄 **Name**: IUPAC name
- 🧪 **Formula**: Chemical composition (e.g., C₆H₆)
- ⚖️ **Weight**: Molecular weight in g/mol
- 🔗 **SMILES**: Canonical SMILES notation
- 🏷️ **CID**: PubChem Compound ID (unique identifier)
- 🖼️ **2D Structure**: Both SVG and PNG formats
- 🌐 **3D Link**: Direct MolView URL

---

## 🔧 Technical Implementation

### **Service Functions** (`pubchemService.ts`)

#### **Search & Fetch Functions**
```typescript
// Find molecule CID by name
searchMolecule(moleculeName: string): Promise<number | null>

// Get all molecule data by name
getMoleculeByName(moleculeName: string): Promise<MoleculeData | null>

// Get molecule data directly by CID
getMoleculeByCID(cid: number): Promise<MoleculeData | null>

// Fetch complete structure details
fetchMoleculeStructure(cid: number): Promise<MoleculeData | null>
```

#### **2D Structure Functions**
```typescript
// Get PNG image URL (like MolView for 3D)
get2DStructureUrl(cid: number, imageSize?: number): string
// Returns: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/{cid}/PNG

// Get high-quality PNG blob
get2DStructurePNG(cid: number, imageSize?: number): Promise<string | null>

// Get SVG data for vector rendering
getMoleculeSVG(cid: number): Promise<string | null>
```

#### **3D MolView Functions**
```typescript
// Generate MolView URL using CID
getMolViewUrl(cid: number, mode?: string): string
// Returns: https://embed.molview.org/v1/?mode=balls&cid={cid}

// Generate MolView URL using SMILES
getMolViewUrlFromSmiles(smiles: string, mode?: string): string
// Returns: https://embed.molview.org/v1/?mode=balls&smiles={SMILES}
```

### **Component Updates** (`MoleculeSearch.tsx`)

**New Features:**
1. **View 3D Button**: Opens MolView in new tab
   ```typescript
   const handleView3D = () => {
     const molViewUrl = getMolViewUrl(moleculeData.cid, 'balls');
     window.open(molViewUrl, '_blank');
   };
   ```

2. **Enhanced 2D Display**: Shows both SVG and PNG formats
   ```typescript
   // SVG render if available
   <div dangerouslySetInnerHTML={{ __html: moleculeData.svgData }} />
   
   // PNG fallback
   <img src={get2DStructureUrl(moleculeData.cid, 500)} />
   ```

3. **Improved UI**:
   - Eye icon button for 3D viewer link
   - Side-by-side molecule info and structure
   - Updated tips mentioning both 2D and 3D features

---

## 📊 Data Flow

### **Complete Workflow**
```
┌─────────────────────────────────────────┐
│  User Enters Molecule Name              │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  searchMolecule() → Get CID             │
│  (Autocomplete + Fallback)              │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  fetchMoleculeStructure(CID)            │
│  - Get properties                       │
│  - Fetch SVG/PNG URLs                   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  MoleculeData Object Created            │
│  ├─ name, formula, weight               │
│ ├─ CID (universal identifier)           │
│  ├─ 2D Structure (SVG + PNG)            │
│  └─ SMILES (for MolView)                │
└────────────────┬────────────────────────┘
                 ↓
    ┌────────────┴────────────┐
    ↓                          ↓
┌──────────────────┐  ┌──────────────────┐
│  Display 2D      │  │  View 3D Button  │
│  Structure       │  │  (MolView Link)  │
└──────────────────┘  └─────────┬────────┘
                                 ↓
                      ┌────────────────────┐
                      │ Open MolView in    │
                      │ Browser with CID   │
                      └────────────────────┘
```

---

## 🎨 User Interface

### **Molecule Search Modal Layout**

```
┌─────────────────────────────────────────────┐
│ 🔍 Search Molecules                     ✕  │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│ Molecule Name                               │
│ [Input Field]           [Search Button]     │ ← Search
│                                             │
│ Recent Searches:  [benzene] [water] [...]  │ ← History
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Benzene                                     │ ← Results
│ Formula: C₆H₆          Weight: 78.11 g/mol │
│ SMILES: c1ccccc1                            │
│ CID: 241                                    │
│                                             │
│ 2D Structure          [View 3D] ← Button    │
│ ┌──────────────────────────────────────┐   │
│ │       [Benzene Ring Structure]       │   │
│ │              (SVG/PNG)               │   │
│ └──────────────────────────────────────┘   │
│                                             │
│  [Insert into Canvas]                      │ ← Actions
│                                             │
└─────────────────────────────────────────────┘
```

---

## 💡 Usage Examples

### **Example 1: Search and View Benzene**
```
1. Click "Search Molecules" button
2. Type "benzene"
3. Press Enter or click Search
4. See benzene structure (2D)
5. Click "View 3D" to see interactive 3D model in MolView
```

### **Example 2: Compare Isomers**
```
1. Search "toluene" → View 2D structure
2. Click "View 3D" → Rotate and examine in MolView
3. Go back, search "xylene" → Compare structures
4. Click "View 3D" for xylene
```

### **Example 3: Insert into Canvas**
```
1. Search "glucose"
2. Click "Insert into Canvas"
3. Glucose appears on your chemistry canvas
4. Resize, rotate, or move as needed
```

---

## 🔗 API Endpoints Used

### **PubChem Endpoints**

| Purpose | Endpoint | Method |
|---------|----------|--------|
| Search CID | `/cgi-bin/autocomplete.cgi` | GET |
| Get Properties | `/rest/pug/compound/CID/{cid}/property/...` | GET |
| Get PNG Image | `/rest/pug/compound/CID/{cid}/PNG` | GET |
| Get SVG Data | `/rest/pug/compound/CID/{cid}/SVG` | GET |

### **MolView Endpoints**

| Purpose | URL | Notes |
|---------|-----|-------|
| 3D Viewer | `embed.molview.org/v1/?mode=balls&cid={cid}` | Uses CID |
| Alternative | `embed.molview.org/v1/?mode=balls&smiles={SMILES}` | Uses SMILES |

---

## 🎓 Integration with Existing Features

### **MolecularViewer.tsx (3D Molecules)**
The new system complements existing MolView integration:
- **Existing**: Direct MolView embed in modal
- **New**: Quick access to MolView from molecule search

### **Canvas.tsx**
- Receives molecule data from search
- Can render 2D structure directly on canvas
- Maintains both 2D drawing and molecule visualization

### **ChemistryToolbar.tsx**
- "Search Molecules" button triggers search modal
- Integrates with other tools (Calculator, Periodic Table, 3D Molecules)

---

## 📦 Files Modified

### **Created/Enhanced**

| File | Changes |
|------|---------|
| `src/services/pubchemService.ts` | Added 2D/3D URL generators, CID-based functions |
| `src/components/MoleculeSearch.tsx` | Added "View 3D" button, improved 2D display |
| `MOLECULE_SEARCH_2D_3D_INTEGRATION.md` | This documentation |

---

## ✅ Checklist

- [x] CID-based molecule retrieval
- [x] 2D structure display (SVG + PNG)
- [x] MolView 3D integration
- [x] High-quality image rendering
- [x] Error handling and fallbacks
- [x] User-friendly UI
- [x] Documentation
- [ ] Canvas molecule insertion (next phase)
- [ ] Molecule library/favorites (future)

---

## 🔮 Future Enhancements

1. **Direct Canvas Rendering**
   - Insert SVG structures directly onto canvas
   - Resize and position molecules

2. **Molecule Library**
   - Save favorite molecules
   - Create custom collections
   - Share with team members

3. **Advanced Visualization**
   - Multiple view modes in canvas
   - Real-time structure updates
   - HOMO-LUMO visualization

4. **Reaction Equations**
   - Build reactions using searched molecules
   - Calculate molecular weights
   - Balance equations automatically

5. **Database Integration**
   - Cache frequently searched molecules
   - Offline access
   - Faster searches

---

## 🚀 Performance Tips

1. **CID Usage**: Always use CID when available for faster retrieval
2. **Image Sizes**: Use 400x400 for quick preview, 500x500+ for detailed view
3. **Caching**: Browser caches images automatically
4. **SVG Preference**: Use SVG for printing/publication, PNG for web display

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| 2D structure not loading | Browser cache might be stale; refresh or clear cache |
| 3D link not opening | Check pop-up blocker settings |
| Molecule not found | Try alternative names or IUPAC nomenclature |
| Slow performance | Check internet connection; try smaller image sizes |

---

**Last Updated**: October 17, 2025  
**Status**: ✅ COMPLETE (2D + 3D Integration)  
**Next Step**: Canvas molecule insertion and rendering
