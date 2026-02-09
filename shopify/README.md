# Custom Door Designer - Shopify Integration

This directory contains optimized files for integrating the Custom Door Designer into your Shopify store. These files are designed for maximum performance without React dependencies.

## Files Included

| File | Description |
|------|-------------|
| `door-configurator.min.js` | Vanilla JavaScript 3D door configurator using Three.js |
| `door-configurator.css` | Standalone CSS styles with dark gray-brown color scheme |
| `shopify-door-configurator.liquid` | Shopify Liquid section template |

## Quick Installation

### Step 1: Upload Assets

1. Go to your Shopify Admin → **Online Store** → **Themes**
2. Click **Actions** → **Edit code** on your active theme
3. In the **Assets** folder:
   - Upload `door-configurator.min.js`
   - Upload `door-configurator.css`
   - Upload a wood texture image as `wood.jpg` (optional)

### Step 2: Add Section Template

1. In the **Sections** folder, click **Add a new section**
2. Name it `door-configurator`
3. Replace all content with the contents of `shopify-door-configurator.liquid`
4. Click **Save**

### Step 3: Add to Product Template

**Option A: Theme Customizer (Recommended)**
1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to your product template
3. Click **Add section** and select **Door Configurator**

**Option B: Manual Template Edit**
Add this to your product template:
```liquid
{% section 'door-configurator' %}
```

## Performance Optimizations

The integration is optimized for Shopify performance:

- **No React dependencies** - Uses vanilla JavaScript with Three.js only
- **Lazy loading** - Three.js loads only when needed
- **Debounced updates** - Configuration changes are batched for smoother rendering
- **Efficient textures** - Wood textures use repeat wrapping and proper caching
- **Minimal DOM manipulation** - Direct Three.js scene updates
- **Deferred script loading** - JavaScript loads after page content

## Panel Types

The configurator supports the following panel types:

| Panel Type | Color Code | Description |
|------------|------------|-------------|
| STANDARD_12MM | `#4A3C31` | Standard 12mm panel - dark brown |
| REEDED_19MM | `#3E3128` | Reeded 19mm panel - dark gray-brown |
| MELAMINE_18MM | `#5C4A3D` | Melamine 18mm panel - medium brown |

## API Reference

### Initialization

The configurator auto-initializes on elements with `data-door-configurator` attribute:

```html
<div id="door-3d-container" data-door-configurator></div>
```

Or initialize manually:

```javascript
var configurator = new DoorConfigurator('container-id', {
  width: 800,
  height: 2100,
  preset: 'single',
  panelType: 'STANDARD_12MM'
});
```

### Methods

| Method | Description | Example |
|--------|-------------|---------|
| `setWidth(value)` | Set door width in mm | `configurator.setWidth(900)` |
| `setHeight(value)` | Set door height in mm | `configurator.setHeight(2200)` |
| `setPreset(value)` | Set door type: 'single' or 'double' | `configurator.setPreset('double')` |
| `setPanelType(value)` | Set panel style | `configurator.setPanelType('REEDED_19MM')` |
| `setMaterial(value)` | Set wood type | `configurator.setMaterial('walnut')` |
| `setFinish(value)` | Set finish: 'natural', 'stained', 'painted' | `configurator.setFinish('stained')` |
| `setColor(value)` | Set color option | `configurator.setColor('dark')` |
| `getConfig()` | Get current configuration object | `var config = configurator.getConfig()` |
| `destroy()` | Clean up and remove configurator | `configurator.destroy()` |

### Events

```javascript
document.getElementById('container-id').addEventListener('doorConfiguratorReady', function(e) {
  var configurator = e.detail;
  console.log('Configurator ready:', configurator.getConfig());
});
```

## Customization

### Colors

Edit the CSS variables in `door-configurator.css`:

```css
:root {
  --door-primary: #4A3C31;    /* Dark brown */
  --door-secondary: #5C4A3D;  /* Medium brown */
  --door-accent: #3E3128;     /* Accent brown */
  --door-border: #453830;     /* Border brown */
}
```

### Pricing

Update the `updatePrice()` function in the Liquid file to match your pricing logic.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - Use freely in your Shopify store.
