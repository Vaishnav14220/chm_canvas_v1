# Lasso Eraser Quick Start Guide

## Feature Summary
The **Lasso Eraser** allows you to draw a free-hand selection on the canvas to erase multiple items at once, providing more precision than rectangular selection.

## Quick Start

### Step 1: Select Eraser Tool
- Click the **Eraser** button in the toolbar
- Current toolbar shows eraser icon

### Step 2: Enter Lasso Mode
- **Hold down Ctrl key** on your keyboard
- Your cursor should indicate Lasso mode is active

### Step 3: Draw Your Selection
1. Click and hold Ctrl
2. Click and drag your mouse to draw a free-hand shape around the items you want to erase
3. You can draw any shape - curves, loops, complex polygons, etc.

### Step 4: Complete Selection
- **Release the mouse button** to complete the lasso
- All shapes **whose center is inside the lasso** will be erased
- The lasso will disappear after execution

## Visual Indicators

### While Drawing
- **Golden/Amber dashed line**: Shows the path of your lasso
- **Light yellow fill**: Indicates the interior selection area
- **Yellow dot**: Marks where you started your selection

### After Release
- All shapes inside the lasso are instantly removed
- The canvas updates to reflect the changes
- You can draw another lasso or use other tools

## Tips & Tricks

### 1. Close Your Lasso
- Make sure to create a closed shape (path should almost return to starting point)
- The algorithm automatically closes the path when you release

### 2. Precise Selection
- Draw slowly for more precise control
- The path captures every mouse position you pass through

### 3. Complex Shapes
- You can make the lasso in any shape you want
- Perfect for selecting circular groups or irregular patterns

### 4. Combining with Other Operations
- Use Shift + Click for rectangular selection (alternative method)
- Switch between different eraser modes as needed

## Keyboard Shortcuts
| Action | Keys |
|--------|------|
| **Lasso Eraser** | Eraser Tool + **Ctrl + Drag** |
| **Area Eraser** | Eraser Tool + **Shift + Drag** |
| **Normal Eraser** | Eraser Tool + **Click & Drag** |

## Common Scenarios

### Scenario 1: Erase Multiple Scattered Items
1. Select Eraser tool
2. Hold Ctrl and draw a lasso around all items you want to remove
3. Release to erase them all at once

### Scenario 2: Selective Deletion
1. Hold Ctrl and trace around specific items
2. Avoid drawing through items you want to keep
3. The lasso only erases items fully inside the boundary

### Scenario 3: Precise Shapes
1. Hold Ctrl and draw tightly around each item
2. Create a heart shape, spiral, or any custom path
3. Release to erase items in that shape

## Technical Details

**How it Works:**
- Uses **ray casting algorithm** (point-in-polygon test)
- Checks if the center of each shape falls inside your lasso path
- Erases any shapes with centers inside the selection

**Performance:**
- Instant execution on release
- Smooth, lag-free drawing
- Works with any number of shapes on canvas

## Troubleshooting

### Issue: Nothing gets erased
- Make sure you hold **Ctrl** while drawing
- Ensure you're using the **Eraser tool** (not another tool)
- The lasso must have at least 3 points (minimum valid polygon)

### Issue: Wrong items got erased
- The algorithm checks if shape **centers** are inside the lasso
- Try drawing a tighter lasso around only the items you want
- For rectangular selection instead, use Shift + Click & Drag

### Issue: Lasso line is hard to see
- The line is **golden/amber colored** (#fbbf24)
- Semi-transparent yellow fill shows the selection area
- Try drawing on a dark canvas background for better visibility

## Advanced Usage

### Keyboard Controls
- **Ctrl + Lasso**: Free-hand selection eraser
- **Shift + Click & Drag**: Rectangle selection eraser
- **Normal Click & Drag**: Brush eraser

### Customization
The feature can be customized by modifying Canvas.tsx:
- Lasso line color: Change `#fbbf24` to your preferred color
- Fill transparency: Adjust `rgba(251, 191, 36, 0.1)` values
- Start point size: Modify the `4` in `ctx.arc(..., 4, ...)`

---

## Need Help?
- **Eraser not working?** Make sure eraser tool is selected
- **Lasso not activating?** Hold down Ctrl key before clicking
- **Selection not working as expected?** Draw closer to items you want to erase

