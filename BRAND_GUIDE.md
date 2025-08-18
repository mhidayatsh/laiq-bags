# LAIQ Bags Brand Guide

## 🎨 Brand Identity

### Logo
- **Primary Logo**: `assets/laiq-logo.png`
- **Logo Type**: Minimalist sans-serif with black outline on white background
- **Logo Colors**: White text with black outline on black background
- **Logo Font**: Custom sans-serif with rounded edges, particularly on 'Q'

### Brand Colors
- **Primary Gold**: `#d4af37` (Laiq text gradient)
- **Secondary Gold**: `#f4d03f` (Gradient end)
- **Charcoal**: `#36454f` (Primary text)
- **Beige**: `#f5f5dc` (Background accents)
- **White**: `#ffffff` (Primary background)

### Typography
- **Primary Font**: Montserrat (for headings)
- **Secondary Font**: Poppins (for body text)
- **Logo Font**: Orbitron (for "LAIQ" text in header and footer)
  - Uppercase letters
  - Black weight (900)
  - Gold gradient styling
  - Letter spacing: 0.05em
  - Used specifically for "LAIQ" branding text

## 📱 Implementation

### Website Logo Usage

#### Header Logo
```html
<a href="index.html" class="flex items-center">
  <h1 class="text-2xl font-bold laiq-logo text-charcoal">
    <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>
  </h1>
</a>
```

#### Footer Logo
```html
<div class="flex items-center mb-4">
  <h3 class="text-2xl font-bold laiq-logo">
    <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>
  </h3>
</div>
```

### CSS Classes

#### Logo Font Styling
```css
.laiq-logo {
  font-family: 'Orbitron', 'Montserrat', sans-serif;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.laiq-logo-text {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-family: 'Orbitron', 'Montserrat', sans-serif;
  font-weight: 900;
  letter-spacing: 0.05em;
}
```

### Font Imports
```html
<!-- Google Fonts: Poppins & Montserrat -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Poppins:wght@400;500;700&display=swap" rel="stylesheet">
<!-- Google Fonts: Orbitron (similar to Lucidity Expand) -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
```

### Favicon & App Icons
```html
<link rel="icon" type="image/png" sizes="32x32" href="/assets/laiq-logo.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/laiq-logo.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/laiq-logo.png">
<link rel="manifest" href="/site.webmanifest">
```

## 📧 Email Templates

### Branded Email Header
All email templates include a consistent header with the LAIQ logo:

```html
<div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center;">
  <div style="display: inline-block; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #36454f; text-transform: uppercase; letter-spacing: -0.02em;">
      <span style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">LAIQ</span> BAGS
    </h1>
  </div>
</div>
```

### Email Footer
```html
<div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
  <p style="color: #666; margin: 0; font-size: 14px;">© 2024 <strong style="color: #d4af37;">Laiq Bags</strong>. All rights reserved.</p>
  <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Carry Style with Confidence</p>
</div>
```

## 🌐 Social Media

### Meta Tags
```html
<meta property="og:title" content="Laiq Bags - Carry Style with Confidence">
<meta property="og:description" content="Discover premium bags and accessories. Carry style with confidence.">
<meta property="og:image" content="/assets/laiq-logo.png">
<meta property="og:url" content="https://laiqbags.com">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Laiq Bags - Carry Style with Confidence">
<meta name="twitter:description" content="Discover premium bags and accessories. Carry style with confidence.">
<meta name="twitter:image" content="/assets/laiq-logo.png">
```

## 📱 PWA Manifest

### Web App Manifest
```json
{
  "name": "Laiq Bags",
  "short_name": "Laiq Bags",
  "description": "Carry Style with Confidence - Premium bags and accessories",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#d4af37",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/assets/laiq-logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/laiq-logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## 🎯 Brand Guidelines

### Logo Usage Rules
1. **Minimum Size**: Never use logo smaller than 16px height
2. **Clear Space**: Maintain clear space around logo equal to the height of the 'L'
3. **Background**: Use on white or light backgrounds for best visibility
4. **Color Variations**: 
   - Primary: Black background with white text and black outline
   - Web: Gradient gold text on white background
   - Email: Gradient gold text on white background

### Typography Rules
1. **Headings**: Use Montserrat font family
2. **Body Text**: Use Poppins font family
3. **Logo Text**: Always uppercase with specific gradient styling
4. **Font Weights**: 
   - Bold (700) for headings and logo
   - Medium (500) for subheadings
   - Regular (400) for body text

### Color Usage
1. **Primary Actions**: Use gold gradient (#d4af37 to #f4d03f)
2. **Text**: Use charcoal (#36454f) for primary text
3. **Backgrounds**: Use white (#ffffff) for main backgrounds
4. **Accents**: Use beige (#f5f5dc) for subtle backgrounds

## 📋 Implementation Checklist

### ✅ Completed
- [x] Logo implementation in header and footer
- [x] Favicon and app icons setup
- [x] Social media meta tags
- [x] Email template branding
- [x] PWA manifest creation
- [x] CSS classes for logo styling
- [x] Brand colors implementation
- [x] Typography setup

### 🔄 Files Updated
- `index.html` - Main page with logo implementation
- `contact.html` - Contact page with logo implementation
- `shop.html` - Shop page with logo implementation
- `utils/emailService.js` - Branded email templates
- `site.webmanifest` - PWA manifest
- `css/styles.css` - Logo styling classes

### 📁 Logo Assets
- `assets/laiq-logo.png` - Primary logo file
- `assets/laiq-logo2.png` - Alternative logo version
- `assets/l.png` - Simplified logo version

## 🚀 Next Steps

### Recommended Actions
1. **Update remaining pages** (about.html, customer pages, admin pages)
2. **Create social media assets** using the logo
3. **Design business cards** with the logo
4. **Create packaging designs** incorporating the logo
5. **Develop marketing materials** using the brand guidelines

### Social Media Assets Needed
- Profile pictures (Instagram, Facebook, Twitter)
- Cover photos for social media pages
- Story templates with logo
- Post templates with brand colors

### Print Materials
- Business cards
- Letterhead
- Packaging labels
- Marketing brochures
- Store signage

---

**Brand Slogan**: "Carry Style with Confidence"

**Contact**: For brand-related questions, contact the development team.
