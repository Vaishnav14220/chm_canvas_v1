# Lasso Eraser Selection Feature

## Overview
Implemented free-hand lasso selection functionality for the eraser tool in the Canvas component. Users can now draw a custom free-hand shape to select and erase multiple items at once.

## How to Use

### Activating Lasso Mode
1. **Select the Eraser Tool** - Click the eraser icon in the toolbar
2. **Hold Ctrl Key** - While holding Ctrl, click and drag on the canvas to draw a lasso
3. **Draw the Selection** - Move your mouse in any shape/path you want to select
4. **Complete the Selection** - Release the mouse button to erase all shapes within the lasso

### Visual Feedback
While drawing the lasso, you'll see:
- **Golden/Amber dashed line** (color: #fbbf24) showing the path of your selection
- **Semi-transparent yellow fill** inside the lasso area
- **Yellow dot** at the starting point of the lasso

## Implementation Details

### State Management
Added new state variable to track lasso selection:
```typescript
const [lassoSelection, setLassoSelection] = useState<{
  points: { x: number; y: number }[];
  isActive: boolean
}>({
  points: [],
  isActive: false
});
```

### Key Functions

#### 1. **Ray Casting Algorithm** (`isPointInPolygon`)
- Implements ray casting algorithm to determine if a point is inside a polygon
- Used to check if shape centers are within the lasso area
- Mathematical approach: Casts a ray from the point and counts intersections with polygon edges

#### 2. **Lasso Activation** (in `startDrawing`)
- Triggered when eraser tool is active AND Ctrl key is pressed
- Initializes lasso with first point at mouse position
- Sets `lassoSelection.isActive = true`

#### 3. **Lasso Path Tracking** (in `draw`)
- As mouse moves, new points are added to `lassoSelection.points` array
- Creates smooth, continuous path based on mouse movement frequency

#### 4. **Lasso Erasing** (in `stopDrawing`)
- On mouse release, filters out all shapes whose centers are inside the lasso
- Uses `isPointInPolygon` to determine which shapes to remove
- Only erases if lasso has 3+ points (valid polygon)
- Resets lasso state after completion

#### 5. **Lasso Rendering** (`drawLassoOverlay`)
- Draws the lasso path with dashed line style
- Fills interior with semi-transparent yellow
- Marks starting point with a circle indicator
- Provides real-time visual feedback during drawing

### Integration Points

#### Canvas useEffect (Lines 195-223)
Updated dependency array to include `lassoSelection`:
```typescript
}, [showGrid, canvasBackground, shapes, forceRedraw, areaEraseSelection, lassoSelection]);
```

Added lasso rendering:
```typescript
if (lassoSelection.isActive && lassoSelection.points.length > 0) {
  drawLassoOverlay(ctx, lassoSelection.points);
}
```

### Comparison with Area Erase
- **Area Erase (Shift + Click)**: Rectangular selection
- **Lasso Erase (Ctrl + Click & Drag)**: Free-hand polygonal selection for more precise control

## Technical Features

### Precision
- Ray casting algorithm handles complex polygon shapes
- Checks if shape center point is inside the lasso area
- More accurate than bounding box methods

### Performance
- Lightweight point-in-polygon algorithm with O(n) complexity
- Only runs on mouse release (not during drawing)
- Smooth rendering during lasso drawing with visual feedback

### User Experience
- Clear visual indication of lasso mode active
- Real-time feedback showing selection path
- Semi-transparent fill shows affected area
- Smooth mouse tracking for natural drawing

## Browser Compatibility
- Works in all modern browsers supporting HTML5 Canvas
- Uses standard Canvas 2D API methods
- No external dependencies required

## Future Enhancements
1. Add eraser size adjustment for lasso mode
2. Implement lasso path smoothing algorithm
3. Add multi-selection (Shift + Lasso for additive selection)
4. Support for lasso mode on other tools (selection, transformation)
5. Undo/Redo for lasso operations

## Code Location
- **File**: `src/components/Canvas.tsx`
- **State**: Lines 128-133
- **Algorithm**: Lines 275-293
- **Main Logic**: Lines 423-440 (startDrawing), 452-461 (draw), 1075-1090 (stopDrawing)
- **Rendering**: Lines 325-360 (drawLassoOverlay)
