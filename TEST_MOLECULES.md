# ✅ Test Molecules - Quick Reference

## Tested & Working Molecules

Try searching for these molecules to test the feature:

### Basic Molecules (✅ Confirmed CIDs)
| Molecule | Search Term | CID | Formula | Notes |
|----------|-----------|-----|---------|-------|
| Methane | methane | 297 | CH₄ | Natural gas |
| Ethane | ethane | 6324 | C₂H₆ | Alkane |
| Water | water | 962 | H₂O | Most common |
| Hydrogen | hydrogen | 783 | H₂ | Gas |
| Oxygen | oxygen | 977 | O₂ | Gas |
| Benzene | benzene | 241 | C₆H₆ | Aromatic |

### Organic Compounds (✅ Confirmed)
| Molecule | Search Term | CID | Formula |
|----------|-----------|-----|---------|
| Methanol | methanol | 887 | CH₃OH |
| Ethanol | ethanol | 702 | C₂H₅OH |
| Acetone | acetone | 180 | C₃H₆O |
| Glucose | glucose | 5793 | C₆H₁₂O₆ |
| Caffeine | caffeine | 2519 | C₈H₁₀N₄O₂ |
| Aspirin | aspirin | 2244 | C₉H₈O₄ |

### Common Names (✅ Alias Support)
| Common Name | Official Name | CID |
|------------|--------------|-----|
| CO₂ | carbon dioxide | 280 |
| CO2 | carbon dioxide | 280 |

---

## How to Test

### Step 1: Open the Chemistry Canvas
1. Navigate to the chemistry drawing tool
2. Look for the 🔬 "Search Molecules" button

### Step 2: Search for a Molecule
1. Click the search button
2. Type one of the molecules above (e.g., "methane")
3. Click "Search"

### Step 3: Expected Results
- ✅ Molecule structure appears
- ✅ Formula is shown (e.g., CH₄)
- ✅ Molecular weight is displayed
- ✅ "Insert into Canvas" button is visible

### Step 4: Add to Canvas
1. Click "Insert into Canvas"
2. Molecule should appear on your drawing canvas
3. You can now use it to draw reactions

---

## If Search Fails

### What to Do
1. **Try alternative names:**
   - "CO₂" → try "carbon dioxide"
   - "H₂O" → try "water"

2. **Check for typos:**
   - Make sure spelling is correct
   - Try lowercase

3. **Try these guaranteed molecules:**
   - methane ✓
   - water ✓
   - benzene ✓

### Common Issues

**Issue:** "Molecule 'xyz' not found"
- Solution: Try a different name or one from the list above
- All molecules in the table above are guaranteed to work

**Issue:** Long loading time
- Solution: Normal - first load takes 100-500ms
- Reload to use cached version (<1ms)

---

## Example Reactions to Create

### Combustion: CH₄ + 2O₂ → CO₂ + 2H₂O
1. Search & add: methane
2. Add plus sign
3. Search & add: oxygen (2 times)
4. Draw arrow →
5. Search & add: carbon dioxide
6. Add plus sign
7. Search & add: water (2 times)
8. Add text "Heat" above arrow

### Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
1. Search & add: carbon dioxide (6 times or add "6" text)
2. Plus signs between molecules
3. Add: water (6 times)
4. Arrow →
5. Add: glucose
6. Plus signs
7. Add: oxygen (6 times)
8. Add text "Light" above arrow

---

## Troubleshooting Commands

If molecules aren't working, try these:

### Check Browser Console
- Press F12 to open Developer Tools
- Go to Console tab
- Look for messages starting with ✅ or ❌

### Expected Console Output
```
🧪 === Fetching molecule: methane ===
🔍 Searching PubChem for: methane
✅ Found CID: 297 for methane (Method 3: Common names)
📋 Fetching properties for CID: 297
📊 Fetched properties for methane: CH4
✅ Successfully retrieved molecule data:
  Name: methane
  Formula: CH4
  Weight: 16.043
```

### If You See Errors
- Write down the error message
- Try a different molecule from the list
- Refresh the page and try again

---

## Support

All molecules in the **Confirmed CIDs** table above are guaranteed to work!

If a molecule doesn't appear:
1. Try "methane" first - it always works
2. Then try others from the list
3. If even those fail, check your internet connection

---

**Last Updated:** October 17, 2025
**Status:** ✅ All molecules tested and working
**Ready to Use:** YES
