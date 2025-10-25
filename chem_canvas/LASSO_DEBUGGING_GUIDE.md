# Lasso Selection - Debugging Guide

## 🔍 How to Test Lasso Selection

### Step 1: Draw Some Shapes First
1. Select any drawing tool (e.g., Circle, Square, etc.)
2. Draw a few shapes on the canvas
3. These will be your test targets for erasing

### Step 2: Activate Lasso Eraser Mode
1. **Click the Eraser Tool** in the toolbar
2. **Hold down the Ctrl Key** (on Windows/Linux) or **Cmd Key** (on Mac)
3. **Click and drag** on the canvas to draw a free-hand selection

### Step 3: Monitor Console Output
Open your browser's Developer Console (F12) to see debug logs:

```
Lasso selection started at: { x: 100, y: 150 }
Lasso point added: { x: 105, y: 152 } Total points: 2
Lasso point added: { x: 110, y: 155 } Total points: 3
...
Lasso selection complete with 25 points
Shape at 120 150 inside lasso: true
Shape at 200 200 inside lasso: false
Shapes before: 5 Shapes after: 3
```

### Step 4: Visual Feedback
While drawing, you should see:
- 🟡 **Golden dashed line** tracing your path
- 🟨 **Semi-transparent yellow fill** inside your selection
- 🟡 **Yellow dot** at your starting point

---

## ✅ Troubleshooting Checklist

### Issue 1: Lasso Mode Doesn't Activate
**Problem**: Console shows no "Lasso selection started" message

**Solutions**:
1. ✓ Make sure **Eraser tool is selected** (not another tool)
2. ✓ Make sure **Ctrl key is held DOWN** before clicking
3. ✓ Try clicking on the canvas with Ctrl held
4. ✓ Check browser console for any JavaScript errors

**Console Check**:
```javascript
// Open browser console and type:
console.log('Eraser tool active');
// You should see: true or false
```

---

### Issue 2: Lasso Line Not Visible
**Problem**: You don't see the golden dashed line while drawing

**Solutions**:
1. ✓ Make sure you're on a **dark background** (golden line shows better)
2. ✓ Draw **more slowly and deliberately**
3. ✓ Check console for point collection messages
4. ✓ Try drawing a bigger lasso

**Expected Console Output**:
```
Lasso point added: { x: 100, y: 150 } Total points: 2
Lasso point added: { x: 105, y: 155 } Total points: 3
Lasso point added: { x: 110, y: 160 } Total points: 4
```

---

### Issue 3: Nothing Gets Erased
**Problem**: Even though you completed the lasso, shapes aren't deleted

**Possible Causes**:

**A) Not enough points in lasso**
- Need **minimum 3 points** to create a valid polygon
- Solution: Draw a bigger lasso shape

**B) Shapes' centers not inside lasso**
- Algorithm checks if shape **center** is inside polygon
- Solution: Draw lasso closer to/around the shape centers

**C) Point-in-polygon algorithm issue**
- Check console for: `Shape at X Y inside lasso: true/false`
- Solution: Redraw lasso, ensuring shapes are clearly inside

---

## 🔧 Manual Testing Steps

### Test 1: Basic Functionality
```
1. Draw a circle at position (200, 200)
2. Lasso it with Ctrl+Drag
3. Draw a small circle around it
4. Release mouse
5. Expected: Circle is erased
```

### Test 2: Multiple Shapes
```
1. Draw 3-4 shapes spread out
2. Lasso only 2 of them with Ctrl+Drag
3. Expected: Only the 2 inside lasso are erased
4. Others remain untouched
```

### Test 3: Complex Lasso
```
1. Draw several shapes in a line
2. Draw lasso in a wavy/curvy shape that encompasses some
3. Expected: Only shapes with centers inside the path are erased
```

### Test 4: Edge Cases
```
1. Draw lasso with fewer than 3 points
2. Expected: Nothing should happen (needs minimum 3 points)

3. Draw very large lasso encompassing all shapes
4. Expected: All shapes with centers inside are erased
```

---

## 📊 Console Log Reference

### Successful Lasso Activation
```
✓ Lasso selection started at: { x: 150, y: 200 }
✓ Lasso point added: { x: 152, y: 205 } Total points: 2
✓ Lasso point added: { x: 155, y: 210 } Total points: 3
...
✓ Lasso selection complete with 24 points
✓ Shape at 160 210 inside lasso: true
✓ Shape at 300 300 inside lasso: false
✓ Shapes before: 5 Shapes after: 4
```

### Issue: Not in Eraser Mode
```
✗ No "Lasso selection started" message
✗ Check console - might see warnings about other tools
```

### Issue: Lasso Not Rendering
```
✗ "Lasso point added" messages appear in console
✗ But golden line not visible on canvas
✗ Check if using light background color
```

### Issue: Point-in-Polygon Problem
```
✗ "Lasso selection complete" appears
✗ But all shapes show: inside lasso: false
✗ Means center detection not working properly
✗ Try redrawing lasso closer to shapes
```

---

## 🎯 Expected Behavior

### Before Drawing
- Canvas shows existing shapes
- Lasso state is inactive: `{ points: [], isActive: false }`

### While Drawing Lasso
- ✓ Console logs each point added
- ✓ Golden dashed line appears
- ✓ Yellow semi-transparent fill appears
- ✓ Yellow dot marks the start

### On Release
- ✓ Lasso line disappears
- ✓ Point-in-polygon check runs for each shape
- ✓ Shapes with centers inside are removed
- ✓ Canvas updates with remaining shapes

---

## 🔬 Advanced Debugging

### Check if Lasso State Updates
```typescript
// In browser console, you can't directly access React state,
// but you'll see console.log messages showing state changes
```

### Monitor Point Collection
```
Expected for a smooth lasso:
- 20-50 points for a quick stroke
- 100+ points for a slow, detailed stroke
- Check if reasonable for your drawing speed
```

### Test Point-in-Polygon Algorithm
```
The algorithm checks:
1. Is shape center between first point and last point? (X range check)
2. Do we cross polygon edges? (Ray casting)
3. Odd number of crossings = INSIDE
4. Even number of crossings = OUTSIDE
```

---

## 🛠️ If Still Not Working

### Option 1: Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for any red error messages
4. Share the error text

### Option 2: Verify Keyboard Modifier
- Make sure you're using **Ctrl** (Windows/Linux)
- Or **Cmd** (Mac)
- Not Alt or Shift

### Option 3: Verify Eraser Tool Selection
- Make absolutely sure eraser is selected
- Try clicking eraser button again
- Try switching tools and back

### Option 4: Try Different Background
- If on light background, try dark
- The golden lasso line shows better on dark

---

## 📝 Debug Output Examples

### ✅ Successful Scenario
```
Lasso selection started at: { x: 100, y: 100 }
Lasso point added: { x: 105, y: 105 } Total points: 2
Lasso point added: { x: 110, y: 115 } Total points: 3
Lasso point added: { x: 120, y: 120 } Total points: 4
Lasso point added: { x: 130, y: 125 } Total points: 5
...
Lasso selection complete with 32 points
Shape at 115 115 inside lasso: true
Shape at 200 200 inside lasso: false
Shape at 118 118 inside lasso: true
Shapes before: 3 Shapes after: 1
```

**Result**: 2 shapes erased ✓

### ❌ Issue Scenario
```
(No console output at all)
```

**Problem**: Lasso mode never activated - Eraser tool not selected or Ctrl not held

---

## 🎓 Key Points to Remember

1. **Ctrl key must be held DOWN** before clicking
2. **Eraser tool must be selected** first
3. **Minimum 3 points** needed for valid polygon
4. **Shape centers** are checked, not entire shape
5. **Golden color** (#fbbf24) - check contrast with background
6. **Console logs** will help you debug issues

---

## 🚀 Next Steps

1. **Open browser console** (F12)
2. **Select eraser tool**
3. **Hold Ctrl and draw** on canvas
4. **Watch console for messages**
5. **Check if lasso line appears**
6. **Release mouse to erase**
7. **Verify shapes were erased**

If you see the lasso line and console logs, the feature is working!

If not, the console logs will tell you exactly where the issue is.

---

**Need help? Check the console output - it will tell you exactly what's happening!**
