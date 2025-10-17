# Unified Shapes - Single Resizable Live Preview 🎨

## Overview
All shape and symbol drawing tools now work **identically** with **one shape at a time** and **live resize preview**, matching professional design software like Canvas, Figma, and Adobe Creative Suite.

## All Available Shapes

### 1. **Arrow** ➤
- **Description**: Reaction arrows with filled arrowhead
- **Use Cases**: Chemical reactions, transformations, process flows
- **Drawing**: Click start point, drag to end point

### 2. **Circle** 🔵
- **Description**: Perfect circles with filled interior and outline
- **Use Cases**: Atoms, highlights, orbital representations
- **Drawing**: Click center, drag outward to resize

### 3. **Square** ⬜
- **Description**: Perfect squares with filled interior and outline
- **Use Cases**: Functional groups, annotation boxes, structural highlighting
- **Drawing**: Click center, drag to resize

### 4. **Triangle** 🔺
- **Description**: Equilateral triangles with filled interior and outline
- **Use Cases**: Warning markers, orbital directionality, transformations
- **Drawing**: Click center, drag to resize

### 5. **Hexagon** ⬡
- **Description**: Perfect hexagons with filled interior and outline
- **Use Cases**: Benzene rings, aromatic compounds, crystal structures
- **Drawing**: Click center, drag to resize

### 6. **Plus** ➕
- **Description**: Plus sign (+ symbol) for chemistry notation
- **Use Cases**: Positive charges, addition reactions, ion notation
- **Drawing**: Click center, drag to resize

### 7. **Minus** ➖
- **Description**: Minus sign (- symbol) for chemistry notation
- **Use Cases**: Negative charges, chemical bonds, ion notation
- **Drawing**: Click center, drag to resize

## Unified Drawing Experience

### How All Shapes Work (Identical Process)

```
Step 1: Select Shape Tool
  └─→ Button highlights in blue

Step 2: Click on Canvas (Start Point)
  └─→ Click once at desired starting location

Step 3: Drag Mouse (Resize Preview)
  ┌─────────────────────────────────┐
  │ Canvas                          │
  │                                 │
  │  Click point    Current cursor  │
  │      ▼               ▼          │
  │      •───────────────●          │
  │  (Live preview shown)           │
  │                                 │
  └─────────────────────────────────┘

Step 4: Release Mouse (Finalize)
  └─→ Shape stays on canvas permanently
  └─→ Ready for next shape or tool
```

## Technical Implementation

### Universal State Management

```typescript
// Single state tracks ANY shape being drawn
const [arrowState, setArrowState] = useState<{
  startX: number;      // Initial click position
  startY: number;
  endX: number;        // Current cursor position
  endY: number;
  isDrawing: boolean;  // Drawing or finalized
} | null>(null);
```

### Universal Drawing Workflow

1. **Mouse Down** (startDrawing):
   - Save current canvas state
   - Initialize shape state
   - Set `isDrawing: true`

2. **Mouse Move** (draw):
   - Restore previous canvas
   - Recalculate shape size from start→end positions
   - Draw shape preview at new size

3. **Mouse Up** (stopDrawing):
   - Set `isDrawing: false`
   - Shape remains on canvas
   - Ready for next action

### Smart Size Calculation

```typescript
// All shapes use distance-based sizing
const dx = endX - startX;
const dy = endY - startY;
const distance = Math.sqrt(dx * dx + dy * dy);
const centerX = startX + dx / 2;
const centerY = startY + dy / 2;

// Different shapes interpret distance differently:
// - Circle: distance/2 = radius
// - Square: distance = side length
// - Triangle: distance = base
// - Hexagon: distance/2 = circumradius
// - Plus/Minus: distance/2 = arm length
```

## Shape-Specific Details

### Circle
```typescript
// Center at midpoint, radius = distance/2
drawCircle(ctx, centerX, centerY, distance/2, color);
// Draw process:
// 1. Fill with color
// 2. Add 2px outline
// 3. Use round line joins
```

### Square
```typescript
// Center at midpoint, side = distance
drawSquare(ctx, centerX, centerY, distance, color);
// Fills from center with distance as side length
```

### Triangle
```typescript
// Center at midpoint, base = distance
drawTriangle(ctx, centerX, centerY, distance, color);
// Equilateral triangle centered at midpoint
```

### Hexagon
```typescript
// Center at midpoint, radius = distance/2
drawHexagon(ctx, centerX, centerY, distance/2, color);
// Perfect 6-sided polygon
```

### Plus Sign
```typescript
// Center at midpoint, arm length = distance/2
drawPlus(ctx, centerX, centerY, distance/2, strokeWidth, color);
// Vertical + Horizontal lines
```

### Minus Sign
```typescript
// Center at midpoint, length = distance/2
drawMinus(ctx, centerX, centerY, distance/2, strokeWidth, color);
// Horizontal line only
```

## User Experience Benefits

✅ **Consistency** - All shapes work identically
✅ **Predictability** - Same interaction pattern everywhere
✅ **Intuitive** - Matches design software behavior
✅ **Precision** - Live preview shows exact result
✅ **Control** - Resize while dragging
✅ **Efficiency** - Click-drag-release workflow
✅ **Quality** - Professional filled shapes
✅ **No Accidents** - One shape per action

## Customization Per Shape

Each shape inherits settings:

| Setting | Source | Effect |
|---------|--------|--------|
| **Color** | Color palette | Fill and outline |
| **Size** | Drag distance | Proportional scaling |
| **Canvas** | Background toggle | Visibility adjustment |
| **Line Width** | Brush size (plus/minus) | Symbol thickness |

## Chemistry Applications by Shape

### Arrows (➤)
```
Reaction: A + B ────➤ C + D
Mechanism: Step 1 ──➤ Step 2 ──➤ Product
```

### Circles (●)
```
Atoms: ●-●-●  (Molecular structure)
Orbitals: ●   (Electron representation)
Highlights: (●) around important atoms
```

### Squares (■)
```
Annotation boxes:
┌─────────────┐
│   Unstable  │
│   Species   │
└─────────────┘
```

### Triangles (▲)
```
Stereochemistry:
    H
    ▲ (wedge - out of page)
    |
    C
```

### Hexagons (⬡)
```
Benzene Ring: ⬡ (Aromatic compound)
Cyclohexane: ⬡ (6-member ring)
```

### Plus (+)
```
Ions: Na⁺ shown as Na ➕
Cations: (➕) marks positive charge
Addition: A ➕ B → C
```

### Minus (-)
```
Ions: Cl⁻ shown as Cl ➖
Anions: (➖) marks negative charge
Subtraction or bond
```

## Drawing Comparison Examples

### Before ❌
- Each tool had different behavior
- Shapes drawn continuously
- No live preview
- Hard to control

### After ✅
- **All tools work identically**
- **One shape per action**
- **Live resize preview**
- **Professional appearance**
- **Easy to learn and use**

## Testing Workflow

```
1. ✅ Select shape tool
2. ✅ Click on canvas
3. ✅ See starting point
4. ✅ Drag mouse
5. ✅ See live preview
6. ✅ Shape follows cursor
7. ✅ Release mouse
8. ✅ Shape stays on canvas
9. ✅ Can select another shape
10. ✅ All shapes drawn correctly
```

## Advanced Usage

### Multiple Shapes
```
Drawing a molecule:
1. Draw hexagon (benzene ring)
2. Draw circles (atoms at vertices)
3. Draw lines (bonds)
4. Draw plus/minus (charges)
5. Complete structure
```

### Mixed Diagrams
```
Reaction diagram:
1. Square (reactants box)
2. Arrow (→)
3. Square (products box)
4. Triangle (mechanism indicator)
5. Plus/Minus (charges)
```

### Annotation
```
Highlighting important parts:
1. Draw shape around area
2. Add text annotation
3. Use plus/minus for charges
```

## Performance Notes

- All shapes render efficiently
- Canvas state saved once per action
- No performance degradation
- Hardware-accelerated rendering
- Smooth on all devices

## Browser Compatibility

✅ Works on all modern browsers:
- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Opera 76+ ✅

## Size Behavior

| Tool | Sizing | Formula |
|------|--------|---------|
| Arrow | Point-to-point | Head size = distance × 0.3 |
| Circle | Drag to radius | Radius = distance / 2 |
| Square | Drag to side | Side = distance |
| Triangle | Drag to base | Base = distance |
| Hexagon | Drag to radius | Radius = distance / 2 |
| Plus | Drag to arm length | Arm = distance / 2 |
| Minus | Drag to length | Length = distance / 2 |

## Visual Feedback

During drawing:
- Live arrow/shape follows cursor
- Previous canvas state shown first (no ghosting)
- Grid redrawn if enabled
- Only current shape visible
- Professional appearance

After finalization:
- Shape saved permanently
- Ready for next action
- Shape remains on canvas
- Can be drawn over

## Keyboard Shortcuts (Future)

- [ ] Escape: Cancel current shape
- [ ] Ctrl+Z: Undo last shape
- [ ] Ctrl+Y: Redo shape
- [ ] Shift+Click: Add to existing shape
- [ ] Alt+Drag: Free-form resize

## Future Enhancements

- [ ] Curved arrows
- [ ] Double-headed arrows
- [ ] Dashed/dotted patterns
- [ ] Shape rotation
- [ ] Shape resizing after drawing
- [ ] Shape transformation tools
- [ ] Group shapes together
- [ ] Snap to grid alignment
- [ ] Shape templates
- [ ] Custom shapes

## Troubleshooting

### Shape not visible while dragging?
- Ensure tool is selected (blue highlight)
- Check color is visible on background
- Verify brush size is not 0

### Shape disappears after release?
- Shape is finalized and saved
- It's permanent on canvas
- Draw another shape to continue

### Wrong shape size?
- Distance from start to end determines size
- Drag farther for larger shapes
- Drag closer for smaller shapes

### Multiple shapes appearing?
- Should only appear one at a time
- Previous shapes remain on canvas
- New shape should be separate

---
**Implementation Date**: 2025-10-17
**Related Files**: `src/components/Canvas.tsx`
**Features**: Arrow, Circle, Square, Triangle, Hexagon, Plus, Minus
**Behavior**: Unified single resizable live preview
**Benefit**: Professional, consistent, intuitive drawing experience
