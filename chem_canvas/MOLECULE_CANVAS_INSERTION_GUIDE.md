# 🧬 Molecule Canvas Insertion - Complete Guide

## Overview

Users can now search for molecules using PubChem and **directly insert them into the chemistry canvas** as rendered structures. This creates a seamless workflow from discovery to visualization.

---

## 🎯 Key Features

### 1. **Search & Insert Workflow**
```
Search Molecule
    ↓
View 2D Structure & Properties
    ↓
Click "Insert into Canvas"
    ↓
Molecule appears on canvas
    ↓
Move, Resize, Rotate as needed
```

### 2. **Molecule Representation on Canvas**
- **Type**: New "molecule" shape type
- **Data Storage**: Complete molecule metadata (CID, formula, weight, SMILES)
- **Rendering**: SVG-based for scalability
- **Positioning**: Center of canvas on insertion
- **Manipulation**: Full support for move, resize, and rotate

### 3. **Complete Molecule Data**
Each molecule on canvas contains:
```typescript
{
  id: string;                    // Unique ID
  name: string;                  // IUPAC name
  cid: number;                   // PubChem Compound ID
  formula: string;               // Chemical formula (e.g., C₆H₆)
  weight: number;                // Molecular weight (g/mol)
  svgUrl: string;                // PNG fallback URL
  svgData: string;               // Actual SVG markup
  smiles: string;                // SMILES notation
}
```

---

## 🔄 Implementation Details

### **Data Flow**

```
┌─────────────────────────────────┐
│  User Clicks Search Molecules   │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  Search Modal Opens             │
│  - Input molecule name          │
│  - Query PubChem API            │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  Display Results                │
│  - 2D structure (SVG/PNG)       │
│  - Molecule properties          │
│  - "Insert into Canvas" button  │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  User Clicks "Insert"           │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  Canvas Handler:                │
│  1. Get canvas center position  │
│  2. Create Shape object         │
│  3. Add molecule data to Shape  │
│  4. Add to shapes array         │
│  5. Update canvas history       │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  Canvas Rendering:              │
│  1. Detect "molecule" type      │
│  2. Parse SVG data              │
│  3. Scale & position SVG        │
│  4. Render on canvas            │
│  5. Apply transformations       │
│  6. Show selection indicator    │
└────────────┬─────────────────────┘
             ↓
┌─────────────────────────────────┐
│  Molecule Visible on Canvas!    │
│  Users can now:                 │
│  - Move with Move tool          │
│  - Rotate with Rotate tool      │
│  - Resize by dragging           │
│  - Delete or export             │
└─────────────────────────────────┘
```

### **Canvas Component Updates**

#### **Shape Interface Extension**
```typescript
interface Shape {
  id: string;
  type: 'arrow' | 'circle' | 'square' | 'triangle' | 'hexagon' | 'plus' | 'minus' | 'molecule';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  rotation: number;
  
  // NEW: Molecule-specific data
  moleculeData?: {
    name: string;
    cid: number;
    formula: string;
    weight: number;
    svgUrl: string;
    svgData?: string;
    smiles: string;
  };
}
```

#### **Insertion Handler**
```typescript
onSelectMolecule={(moleculeData) => {
  // 1. Get canvas center position
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // 2. Create Shape object with molecule data
  const newMolecule: Shape = {
    id: `molecule-${Date.now()}`,
    type: 'molecule',
    startX: centerX,
    startY: centerY,
    endX: centerX + 100,
    endY: centerY + 100,
    color: chemistryColor,
    size: chemistrySize,
    rotation: 0,
    moleculeData: moleculeData  // Complete data
  };
  
  // 3. Add to canvas
  setShapes([...shapes, newMolecule]);
  
  // 4. Callback notification
  if (onMoleculeInserted) {
    onMoleculeInserted(moleculeData);
  }
}}
```

#### **SVG Rendering**
```typescript
const drawMolecule = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  // Parse SVG data
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(shape.moleculeData.svgData, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Scale SVG
  svgElement.setAttribute('width', `${shape.size}`);
  svgElement.setAttribute('height', `${shape.size}`);
  
  // Apply transformations & render
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);
  
  ctx.drawImage(svgElement, shape.startX, shape.startY, shape.size, shape.size);
  
  ctx.restore();
};
```

---

## 📋 Step-by-Step Usage

### **Step 1: Open Molecule Search**
```
1. Click "Search Molecules" button 🔬
   Location: Chemistry Tools panel
   Icon: Microscope
```

### **Step 2: Search for Molecule**
```
2. Type molecule name in search field
   Examples: "benzene", "glucose", "caffeine"
   
3. Press Enter or click Search button
```

### **Step 3: View 2D Structure**
```
4. Modal displays:
   - Molecule name (IUPAC)
   - Chemical formula
   - Molecular weight
   - SMILES notation
   - PubChem CID
   - 2D structure (SVG or PNG)
   - "View 3D" button (opens MolView)
```

### **Step 4: Insert into Canvas**
```
5. Click "Insert into Canvas" button ✅
   - Molecule appears at canvas center
   - Modal closes
   - Shape is added to history
```

### **Step 5: Manipulate on Canvas**
```
6. Use tools to modify:
   - Move Tool: Click & drag to reposition
   - Rotate Tool: Right-click & rotate
   - Resize: Drag edge to change size
   - Delete: Right-click context menu
```

---

## 🎨 Visual Example

### **Before Insertion**
```
┌────────────────────────────┐
│  Canvas                    │
│                            │
│                            │
│  (empty, ready for input)  │
│                            │
└────────────────────────────┘
```

### **After Insertion**
```
┌────────────────────────────┐
│  Canvas                    │
│                            │
│        ┌──────────┐        │
│        │  C₆H₆    │        │
│        │ Benzene  │        │
│        │ Ring     │        │
│        └──────────┘        │
│      (Selectable)          │
└────────────────────────────┘
```

---

## 🛠️ Technical Architecture

### **File Structure**
```
Canvas Component:
├── State Management
│   ├── shapes[]           // All shapes including molecules
│   ├── selectedShapeId    // Currently selected shape
│   ├── showMoleculeSearch // Modal visibility
│   └── moleculeData       // Temporary storage
│
├── Handlers
│   ├── onSelectMolecule   // Insertion handler
│   ├── startDrawing       // Interaction start
│   ├── draw               // Real-time updates
│   └── stopDrawing        // Finalization
│
├── Rendering
│   ├── redrawAllShapes()  // Main render loop
│   ├── drawMolecule()     // SVG rendering
│   └── Selection UI       // Visual feedback
│
└── Integration
    ├── MoleculeSearch      // Search modal
    ├── ChemistryToolbar    // Tool selection
    └── Move/Rotate Tools   // Manipulation
```

### **Data Persistence**
- Shapes stored in `canvasHistoryRef` for undo/redo
- Each molecule retains full PubChem data
- Supports export/import of canvas with molecules

---

## ⚙️ Configuration Options

### **Default Insertion Settings**
```typescript
const centerX = canvas.width / 2;      // Horizontal center
const centerY = canvas.height / 2;     // Vertical center
const width = 100;                     // Default width
const height = 100;                    // Default height
const rotation = 0;                    // No initial rotation
const size = chemistrySize;            // Use toolbar size
const color = chemistryColor;          // Use toolbar color
```

### **Customizable**
- Insertion position (can be modified in handler)
- Initial size (configurable via toolbar)
- Color scheme (uses current chemistry toolbar color)
- Rotation (0° default, editable with rotate tool)

---

## 🔗 Integration Points

### **Canvas Component Props**
```typescript
interface CanvasProps {
  // ... existing props
  onMoleculeInserted?: (moleculeData: any) => void;
}
```

### **MoleculeSearch Component**
```typescript
interface MoleculeSearchProps {
  onSelectMolecule?: (moleculeData: any) => void;  // Handles insertion
  isOpen?: boolean;
  onClose?: () => void;
}
```

---

## 📊 Workflow Diagram

```
┌────────────────────────────────────────┐
│  User Interaction Layer                │
│  - Search Molecules Button             │
│  - Search Modal UI                     │
│  - Insert Button Click                 │
└────────────┬─────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  PubChem API Layer                     │
│  - Search molecule name                │
│  - Fetch CID                           │
│  - Get 2D structure (SVG)              │
│  - Get molecular properties            │
└────────────┬─────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Canvas Insertion Handler              │
│  - Position calculation                │
│  - Shape object creation               │
│  - Data attachment                     │
│  - Array update                        │
└────────────┬─────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Canvas Rendering Layer                │
│  - Shape detection (type='molecule')   │
│  - SVG parsing                         │
│  - Transform application               │
│  - Canvas drawing                      │
└────────────┬─────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  User Canvas Layer                     │
│  - Visible molecule on canvas          │
│  - Interactive element                 │
│  - Editable/movable                    │
└────────────────────────────────────────┘
```

---

## ✅ Features Checklist

- [x] Search molecules by name
- [x] Fetch molecule data from PubChem
- [x] Display 2D structure (SVG/PNG)
- [x] Show molecular properties
- [x] "Insert into Canvas" button
- [x] Add molecule to canvas
- [x] Store molecule metadata
- [x] Render molecule on canvas
- [x] Support molecule selection
- [x] Move molecule with Move tool
- [x] Rotate molecule with Rotate tool
- [x] Resize molecule
- [x] Delete molecule
- [x] Export canvas with molecules
- [ ] Molecule library/favorites
- [ ] Batch molecule operations
- [ ] Molecule alignment tools

---

## 🔮 Future Enhancements

1. **Advanced Positioning**
   - Snap to grid
   - Align to other molecules
   - Distribute evenly

2. **Molecule Operations**
   - Copy/paste molecules
   - Create molecule library
   - Group molecules

3. **Advanced Visualization**
   - Change display modes (2D vs 3D preview)
   - Color by property
   - Show molecular orbitals

4. **Reaction Building**
   - Connect molecules with arrows
   - Auto-balance equations
   - Calculate reaction properties

5. **Export Options**
   - SVG export
   - PNG export
   - PDF with annotations
   - Chemical notation import/export

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Molecule not appearing | Check canvas initialization; verify SVG data |
| Molecule too small/large | Use resize handles or size slider |
| Can't move molecule | Select Move tool first, then click molecule |
| Rotation not working | Select Rotate tool, right-click molecule |
| SVG rendering fails | Check browser console; fallback to PNG |

---

## 🎓 Code Examples

### **Basic Insertion**
```typescript
// User clicks "Insert into Canvas"
onSelectMolecule={(moleculeData) => {
  const shape: Shape = {
    id: `mol-${Date.now()}`,
    type: 'molecule',
    startX: canvas.width / 2,
    startY: canvas.height / 2,
    endX: canvas.width / 2 + 100,
    endY: canvas.height / 2 + 100,
    moleculeData: moleculeData,
    // ... other properties
  };
  setShapes([...shapes, shape]);
}}
```

### **Rendering**
```typescript
if (shape.type === 'molecule') {
  drawMolecule(ctx, shape);
}

const drawMolecule = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  // SVG rendering logic
  // Transforms and positioning
  // Canvas drawing
};
```

---

**Last Updated**: October 17, 2025  
**Status**: ✅ COMPLETE (Molecule Insertion Feature)  
**Next Phase**: Advanced molecule operations and reaction building
