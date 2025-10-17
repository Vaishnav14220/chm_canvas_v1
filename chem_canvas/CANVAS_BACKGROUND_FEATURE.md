# Canvas Background & Intelligent Pen Colors 🎨

## Overview
This document describes the intelligent canvas background selection and automatic pen color adjustment feature implemented in the Chemistry Canvas component.

## Features Implemented

### 1. Canvas Background Toggle
Users can now choose between two canvas backgrounds:
- **🌙 Dark Canvas** (Default): Deep navy blue (#0f172a) - Professional scientific appearance
- **☀️ White Canvas**: Clean white (#ffffff) - Traditional paper-like appearance

**Location**: Top-right corner of the canvas, next to grid toggle button

### 2. Intelligent Pen Color Selection
The pen color automatically adapts based on the selected canvas background:

#### Dark Canvas (#0f172a)
- **Default Pen Color**: Bright cyan (#0ea5e9)
- **Grid Color**: Dark slate (#1e293b)
- **Why**: High contrast provides clear visibility for drawing on dark backgrounds

#### White Canvas (#ffffff)
- **Default Pen Color**: Pure black (#000000)
- **Grid Color**: Light gray (#e5e7eb)
- **Why**: Traditional pen-on-paper appearance for familiar user experience

### 3. Automatic Updates
When users switch canvas background:
1. Canvas fills with the new background color
2. Grid color automatically adjusts for optimal visibility
3. Pen color switches to the intelligent default for that background
4. All drawing tools (atoms, bonds, arrows, shapes) adapt accordingly

## Technical Implementation

### State Management
```typescript
const [canvasBackground, setCanvasBackground] = useState<'dark' | 'white'>('dark');

// Intelligent color picker
const getOptimalPenColor = () => {
  return canvasBackground === 'dark' ? '#0ea5e9' : '#000000';
};

// Auto-update pen color when background changes
useEffect(() => {
  setChemistryColor(getOptimalPenColor());
}, [canvasBackground]);
```

### Canvas Initialization
```typescript
// Fill canvas with appropriate background color
ctx.fillStyle = canvasBackground === 'dark' ? '#0f172a' : '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Grid adapts to background
ctx.strokeStyle = canvasBackground === 'dark' ? '#1e293b' : '#e5e7eb';
```

### UI Component
- Two-button toggle with moon (🌙) and sun (☀️) icons
- Active button highlighted with primary color
- Hover effects for better UX
- Tooltip titles for user guidance

## User Experience Benefits

✅ **Better Contrast**: Pen color optimizes for selected background
✅ **Reduced Eye Strain**: Dark mode option for low-light environments
✅ **Professional Appearance**: Clean, intelligent interface
✅ **Accessibility**: Easy-to-read drawings on any background
✅ **User Choice**: Freedom to work in preferred environment

## Color Specifications

### Dark Canvas Theme
| Element | Hex Color | Usage |
|---------|-----------|-------|
| Canvas Background | #0f172a | Main drawing surface |
| Grid | #1e293b | Grid lines |
| Default Pen | #0ea5e9 | Primary drawing color |
| Alt Colors | Various blues/teals | Additional drawing tools |

### White Canvas Theme
| Element | Hex Color | Usage |
|---------|-----------|-------|
| Canvas Background | #ffffff | Main drawing surface |
| Grid | #e5e7eb | Grid lines |
| Default Pen | #000000 | Primary drawing color |
| Alt Colors | Various blacks/grays | Additional drawing tools |

## Drawing Tools Compatibility
All drawing tools work seamlessly with the new background system:
- ✏️ Free pen drawing
- 🧬 Atom drawing
- 🔗 Chemical bonds
- ➡️ Arrows
- 🔵 Shapes (circles, squares, triangles, hexagons)
- ✏️ Eraser

## Future Enhancements
- Custom color palette selection
- Canvas texture options (grid, dots, blank)
- Pen color palette specific to each background
- User preference persistence in localStorage
- Export canvas with selected background

## Testing Checklist
- [x] Dark canvas displays correctly
- [x] White canvas displays correctly
- [x] Grid visibility on both backgrounds
- [x] Pen color switches automatically
- [x] All drawing tools work on both backgrounds
- [x] Zoom and pan work on both backgrounds
- [x] Grid toggle works on both backgrounds
- [x] Clear canvas works on both backgrounds
- [x] UI buttons show active state correctly

---
**Implementation Date**: 2025-10-17
**Related Files**: `src/components/Canvas.tsx`
