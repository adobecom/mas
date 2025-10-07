# Single Card Variant

The Single Card variant is a clean, focused card layout designed for individual product or service display. It features a horizontal layout with content on the left and an image on the right, optimized for single-item merchandising.

## Features

- **Horizontal Layout**: Content and image side-by-side for better space utilization
- **Clean Design**: Minimal, focused layout for individual products/services
- **Responsive**: Adapts to different screen sizes with wide variant support
- **AEM Integration**: Full support for Adobe Experience Manager fragment mapping
- **Accessibility**: Built with accessibility best practices
- **Badge Support**: Optional badge display for promotions or status

## Usage

### Basic Implementation

```html
<merch-card variant="single-card">
    <h3 slot="heading-xs">Product Title</h3>
    <h4 slot="heading-xxs">Product Subtitle</h4>
    <div slot="body-s">Product description goes here...</div>
    <p slot="price">$99.99/month</p>
    <button slot="cta">Get Started</button>
    <div slot="image">
        <img src="product-image.jpg" alt="Product image" />
    </div>
    <div slot="badge">New</div>
</merch-card>
```

### Wide Variant

```html
<merch-card variant="single-card" size="wide">
    <!-- content -->
</merch-card>
```

### With Custom Border Color

```html
<merch-card variant="single-card" border-color="blue">
    <!-- content -->
</merch-card>
```

## AEM Fragment Mapping

The single-card variant includes comprehensive AEM fragment mapping:

- **Background Image**: Maps to `image` slot
- **Badge**: Boolean support for badge display
- **Title**: Maps to `heading-xs` slot (250 char limit)
- **Subtitle**: Maps to `heading-xxs` slot (200 char limit)
- **Description**: Maps to `body-s` slot (2000 char limit)
- **Pricing**: Maps to `price` slot
- **CTA**: Maps to `cta` slot (medium size)
- **Mnemonics**: Small size support
- **Size**: Standard and wide variants
- **Border Color**: Custom border color support

## Styling

The variant uses consistent design tokens:

- **Background**: White with subtle border
- **Border radius**: 8px
- **Padding**: 20px (24px for wide variant)
- **Min width**: 320px (600px for wide)
- **Max width**: 400px (800px for wide)
- **Image size**: 120px × 120px (160px × 160px for wide)

## Layout Structure

```
┌─────────────────────────┬─────────────┐
│ Header                  │             │
│ ├─ Badge               │             │
│ └─ Icons               │             │
├─────────────────────────┤   Image     │
│ Title                   │   Section   │
│ Subtitle                │             │
├─────────────────────────┤             │
│ Description             │             │
├─────────────────────────┤             │
│ Pricing                 │             │
├─────────────────────────┤             │
│ CTA                     │             │
└─────────────────────────┴─────────────┘
```

## Size Variants

### Standard (Default)

- Width: 320px - 400px
- Image: 120px × 120px
- Padding: 20px

### Wide

- Width: 600px - 800px
- Image: 160px × 160px
- Padding: 24px

## Customization

### CSS Custom Properties

```css
:host([variant='single-card']) {
    --consonant-merch-card-background-color: rgb(255, 255, 255);
    --consonant-merch-card-border-color: rgb(230, 230, 230);
    --consonant-merch-card-body-s-color: rgb(34, 34, 34);
}
```

### Border Colors

The variant supports custom border colors:

- `gray`: Uses `--spectrum-gray-300`
- `blue`: Uses `--spectrum-blue-400`

## Examples

### E-commerce Product Card

```html
<merch-card variant="single-card">
    <h3 slot="heading-xs">Adobe Creative Cloud</h3>
    <h4 slot="heading-xxs">All Apps</h4>
    <div slot="body-s">
        Access to all Adobe creative applications with cloud storage and
        collaboration features.
    </div>
    <p slot="price">$52.99/month</p>
    <button slot="cta">Start Free Trial</button>
    <div slot="image">
        <img src="creative-cloud.jpg" alt="Adobe Creative Cloud" />
    </div>
    <div slot="badge">Popular</div>
</merch-card>
```

### Service Offering Card

```html
<merch-card variant="single-card" size="wide" border-color="blue">
    <h3 slot="heading-xs">Adobe Analytics</h3>
    <h4 slot="heading-xxs">Advanced Analytics</h4>
    <div slot="body-s">
        Comprehensive analytics solution for data-driven insights and customer
        journey analysis.
    </div>
    <p slot="price">$99.99/month</p>
    <button slot="cta">Learn More</button>
    <div slot="image">
        <img src="analytics.jpg" alt="Adobe Analytics" />
    </div>
</merch-card>
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Performance

The single-card variant is optimized for performance with:

- Minimal CSS footprint
- Efficient rendering
- Responsive image handling
- Lazy loading support

## Accessibility

- Proper semantic structure with headings
- Alt text support for images
- Keyboard navigation support
- Screen reader friendly
- High contrast support
