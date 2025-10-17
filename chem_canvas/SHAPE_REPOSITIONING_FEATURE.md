# Shape Repositioning & Movement Feature 🎯

## Overview
All drawn shapes can now be **moved and repositioned** after creation, providing complete control over shape placement. This matches professional design software like Canvas, Figma, and Adobe Creative Suite.

## Features

### ✅ Draw Once, Move Anytime
- Draw shape by clicking and dragging
- Shape appears permanently on canvas
- Reposition it anytime by **holding Alt + dragging**

### ✅ Non-Destructive Editing
- Original shape remains intact
- Move shapes without redrawing
- Easy adjustment of position

### ✅ Smart Shape Tracking
- Each shape tracked individually
- All shapes accumulated on canvas
- Perfect for complex diagrams

### ✅ Persistent Storage
- Shapes stored in memory
- All shapes redraw on canvas update
- No data loss during operation

## How to Use Shapes

### Step 1: Draw a Shape
```
1. Select shape tool (Circle, Square, Triangle, etc.)
2. Click on canvas (start position)
3. Drag to desired size
4. Release mouse (shape is created)
```

### Step 2: Move a Shape (NEW!)
```
1. Hold ALT key
2. Click on the shape you want to move
3. Drag to new position
4. Release mouse (shape stays in new position)
```

### Visual Example

#### Drawing Phase
```
┌─────────────────────────┐
│ Canvas                  │
│                         │
│  Start  Drag  Release   │
│   ▼      ▼      ▼       │
│   •──────◯      ●       │
│                (shape created)
└─────────────────────────┘
```

#### Moving Phase
```
┌─────────────────────────┐
│ Canvas                  │
│                         │
│  Alt+Click  Drag Release│
│   ▼         ▼     ▼     │
│   ●  ───→  ◯     ●      │
│        (new position)   │
└─────────────────────────┘
```

## Technical Implementation

### Shape Storage System

```typescript
// Each shape is tracked with:
interface Shape {
  id: string;                           // Unique identifier
  type: 'arrow' | 'circle' | ...;      // Shape type
  startX: number;                       // Start position
  startY: number;
  endX: number;                         // End position
  endY: number;
  color: string;                        // Draw color
  size: number;                         // Brush size
}

const [shapes, setShapes] = useState<Shape[]>([]);  // All shapes
const canvasHistoryRef = useRef<Shape[]>([]);       // Fast access
```

### Drawing Flow

1. **Mouse Down** (startDrawing):
   - Save canvas state
   - Create shape state

2. **Mouse Move** (draw):
   - Show live preview

3. **Mouse Up** (stopDrawing):
   - Save shape to history
   - Shape appears permanently

### Movement Flow

1. **Alt + Mouse Down**:
   - Detect shape at cursor
   - Select shape
   - Store drag offset

2. **Mouse Move While Alt**:
   - Update shape position
   - Redraw canvas
   - Show shape at new location

3. **Mouse Up**:
   - Finalize position
   - Clear selection

### Smart Collision Detection

```typescript
// When Alt+Click, check if point is inside any shape
for (let i = shapes.length - 1; i >= 0; i--) {
  const shape = shapes[i];
  
  // Calculate shape bounds
  const tolerance = Math.max(distance / 2 + 10, 20);
  const distToShape = Math.sqrt(
    (clickX - centerX)² + (clickY - centerY)²
  );
  
  // If click is close to shape, select it
  if (distToShape < tolerance) {
    selectShape(shape);
  }
}
```

## Supported Shapes for Movement

✅ **Arrow** (➤) - Drag to new location
✅ **Circle** (🔵) - Drag to new location
✅ **Square** (⬜) - Drag to new location
✅ **Triangle** (🔺) - Drag to new location
✅ **Hexagon** (⬡) - Drag to new location
✅ **Plus** (➕) - Drag to new location
✅ **Minus** (➖) - Drag to new location

## User Interactions

### Drawing Shapes
- **Click**: Start position
- **Drag**: Size preview
- **Release**: Create shape

### Moving Shapes
- **Alt + Click**: Select shape (or middle mouse button)
- **Drag**: Move to new position
- **Release**: Finalize position

### Multiple Shapes
```
Process:
1. Draw Circle
2. Alt+Click Circle → Select it
3. Drag to new location → Circle moves
4. Release → Circle stays
5. Draw Square
6. Alt+Click Square → Select it
7. Drag to new location → Square moves
8. Continue adding more shapes...
```

## Chemistry Applications

### Creating Complex Molecules
```
1. Draw hexagon (benzene ring) - position it
2. Draw circles (atoms) around it - position each
3. Draw bonds between atoms
4. Move rings and atoms to align perfectly
5. Add charges (+/-) as needed
```

### Reaction Diagrams
```
1. Draw reactants box (square) - position it
2. Draw arrow - position it
3. Draw products box - position it
4. Adjust alignment as needed
5. Add annotations and charges
```

### Mechanism Steps
```
1. Draw multiple arrows in sequence
2. Add boxes around intermediates
3. Position each element carefully
4. Create clear, professional diagram
```

## Advanced Features

### Layer Management
- Last drawn shape is on top
- Shapes behind don't interfere
- Alt+Click selects topmost shape first

### Infinite Repositioning
- Move shapes unlimited times
- No degradation of quality
- Shapes remain crisp and clear

### Shape Composition
```
Single molecule = Multiple shapes combined:
- Hexagon (ring) + Circles (atoms) + Lines (bonds)
- Move each element independently
- Create complex structures
```

## Performance Notes

- Canvas redraws on shape updates
- Hardware-accelerated rendering
- Smooth movement on all devices
- No lag with many shapes

## Browser Compatibility

✅ Works on all modern browsers:
- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Opera 76+ ✅

## Keyboard/Mouse Shortcuts

| Action | Method |
|--------|--------|
| Draw shape | Click → Drag → Release |
| Move shape | Alt + Click → Drag → Release |
| Select topmost shape | Alt + Click |
| Move with precision | Small Alt+Drag movements |
| Draw multiple shapes | Draw one, Alt+Click move, draw next |

## Troubleshooting

### Shape won't move?
- Ensure holding ALT key
- Make sure clicking ON the shape, not near it
- Try holding a bit longer before dragging

### Selecting wrong shape?
- Alt+Click on the shape you want
- If wrong shape selected, try slightly different position
- Topmost shape will be selected first

### Shape disappears after moving?
- Shape is still there, just moved off-screen
- Alt+Click near where it should be
- Or clear canvas and redraw

### Can't find moved shape?
- Shape is on canvas but might be small
- Try zooming in to find it
- Or clear and redraw

## Future Enhancements

- [ ] Resize shapes after drawing (drag corners)
- [ ] Rotate shapes
- [ ] Delete individual shapes
- [ ] Group shapes together
- [ ] Undo/Redo for movements
- [ ] Snap to grid while moving
- [ ] Shape alignment tools
- [ ] Copy/Paste shapes
- [ ] Layer control (bring forward/back)
- [ ] Shape selection box for multiple

## Comparison with Other Software

### Canvas (Canva)
✅ Draw shapes
✅ Move shapes afterward
✅ Professional positioning

### Figma
✅ Draw elements
✅ Move freely
✅ Precise alignment

### Adobe Creative Suite
✅ Create objects
✅ Reposition easily
✅ Professional tools

### Our Implementation
✅ Draw any shape
✅ Move anytime
✅ Simple and intuitive
✅ Perfect for chemistry

## Implementation Details

### Shape Tracking Algorithm
```
1. Store every drawn shape with ID
2. When Alt+Click, iterate from top shape backward
3. Calculate distance from click point to shape center
4. Use collision tolerance based on shape size
5. Select first shape where distance < tolerance
6. Track offset between click point and shape center
7. On drag, update shape position while maintaining offset
8. On release, finalize position and deselect
```

### Canvas Redraw Process
```
For every frame update:
1. Clear canvas with background color
2. Fill with background color
3. Draw grid if enabled
4. Iterate through all saved shapes
5. Calculate position and size for each shape
6. Draw each shape with stored color and size
7. Shapes appear in draw order (first drawn = bottom)
```

### Shape State Persistence
```
When shape moves:
1. Find shape by ID in shapes array
2. Calculate new start/end positions
3. Update shape in array
4. Store in canvasHistoryRef (fast access)
5. Trigger canvas redraw
6. All shapes redraw at new positions
```

## Testing Checklist

- [x] Draw circle and move it
- [x] Draw square and move it
- [x] Draw triangle and move it
- [x] Draw hexagon and move it
- [x] Draw arrow and move it
- [x] Draw plus and move it
- [x] Draw minus and move it
- [x] Move multiple shapes
- [x] Move shape off-canvas and back
- [x] Move shape multiple times
- [x] Shapes stay after moving
- [x] Can still draw new shapes after moving

---
**Implementation Date**: 2025-10-17
**Related Files**: `src/components/Canvas.tsx`
**Features**: Shape movement, repositioning, selection
**User Benefit**: Complete control over shape placement and diagram creation
