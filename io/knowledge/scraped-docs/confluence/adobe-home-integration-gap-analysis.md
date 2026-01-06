# Adobe Home Integration Gap Analysis

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Adobe+Home+Integration+Gap+Analysis
> Scraped: 2026-01-06T07:39:37.054Z

---


                           
        The following is a detailed analysis of the gaps identified during the integration of displaying Merch cards in Adobe Home.

## 1. Overview of the Integration

- Adobe Home: A React-based application that provides the main experience. It has:Global CSS resets (e.g., box-sizing: border-box; margin: 0; padding: 0; font-family: ...;)Custom overrides for certain Spectrum CSS classes (e.g., .spectrum-Button)A React–Lit “bridge” class that can host Lit web components within React.
- Merch Cards (mas.js): Lit web components that:Typically uses Spectrum CSS for CTA styling (e.g., .spectrum-Button, .spectrum-Button--accent).Contain their own custom CSS (in both light DOM and shadow DOM).

---

## 2. Problems Encountered

### 1. Global CSS in Adobe Home Overriding Merch Card Styles

****

- Adobe Home defines broad CSS resets, such as:


```
*, :after, :before {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: adobe-clean, Helvetica, Arial, sans-serif;
}
```


- This reset is unintentionally stripping or modifying padding and margins in Merch cards. Elements within the Merch card that rely on default or partial styling lose their expected spacing.

### 2. Spectrum CSS Classes Overridden by Adobe Home

****

- Adobe Home also modifies classes that Spectrum CSS depends on, such as .spectrum-Button.
- This leads to “spectrum” styles not appearing correctly (e.g., button sizing, hover states, color changes, etc.).
- Because Merch cards rely on Spectrum CSS, the final appearance of these CTAs is incorrect.

---

## 3. Root Cause Analysis

### 1. Global CSS Resets

- A common practice in React applications (and many modern web apps) is to define a global or “opinionated” style reset to ensure consistency across components.
- However, when third-party or external web components (like Merch cards) are embedded in the app, these global resets can leak into child elements if they are not fully encapsulated.

### 2. Spectrum CSS vs. Adobe Home’s Overrides

- Spectrum CSS uses a class-based approach (e.g., .spectrum-Button, .spectrum-Button--accent) and expects minimal external overrides.
- Adobe Home modifies these Spectrum classes for its own needs, which conflict with the official Spectrum CSS definitions.
- By the time Merch cards render, the “real” Spectrum CSS may be partially or fully overwritten by the custom rules from Adobe Home.

### 3. Lit Web Components’ Styling

- Lit web components can encapsulate styles using the shadow DOM. However, in some cases, parts of the component might still rely on light DOM or globally available CSS classes.
- If any element in the Merch card (especially Spectrum CTA elements) is placed outside shadow DOM scope (or if the container references global classes), external CSS can override it.

---

## 4. Potential Solutions

Below are several approaches, ranging from adopting different technology to adjusting CSS strategies. The best path will depend on engineering constraints, project timelines, and alignment on front-end standards.

### 1. Use Spectrum Web Components Instead of Spectrum CSS

- What it is:Adobe provides Spectrum Web Components which are native web components implementing Spectrum design tokens and styles using shadow DOM.
- Why it helps:Because they encapsulate their own styles in the shadow DOM, global CSS resets from Adobe Home are less likely to leak in and break button or CTA rendering.
- Considerations:Might require re-implementing certain Merch card elements to use the Spectrum Web Components API.If any part of the Merch card is specifically reliant on the Spectrum CSS package, a migration effort is needed.

### 2. Scoped (or More Specific) CSS for Merch Cards

- What it is:Increase the specificity of CSS rules within Merch cards to effectively “out-rank” the Adobe Home rules.For example, prefix all Merch card styles with a root class (e.g., .merch-card) or rely on :host selectors in Lit’s shadow DOM to enforce local styling.
- Why it helps:Ensures that any broad * or generic .spectrum-Button overrides are superseded by more specific rules within the Merch card.
- Considerations:Careful planning is needed so you do not inadvertently override your own styles.In heavily custom-styled environments, you might run into performance or maintainability concerns if the specificity of selectors becomes too high.

### 3. Strict Shadow DOM Encapsulation

- What it is:Move most of the styling for Merch cards (including Spectrum classes) into the shadow DOM, ensuring that the global CSS from Adobe Home cannot cross the shadow boundary.
- Why it helps:Shadow DOM encapsulation means that typical global resets do not penetrate the component’s internal styling (except for inherited properties like font-family).
- Considerations:The Spectrum CSS library does not always play nicely out-of-the-box with strict shadow DOM usage, because it expects global classes. Additional bundling or rewriting might be needed.If certain design tokens or variables are consumed from the host, a bridging approach is required.

### 4. Rename or Remap Spectrum CSS Classes

- What it is:If it’s not possible to adopt web components or a shadow DOM approach, rename or scope the Spectrum CSS classes in the Merch card to avoid collisions. For instance, .spectrum-Button → .merch-spectrum-Button.
- Why it helps:Reduces the chances of collision with Adobe Home’s global overrides for .spectrum-Button.
- Considerations:This could be time-consuming and hamper the maintainability of the code if you rely on frequent updates from Spectrum CSS.You lose the direct usage of the canonical Spectrum class names, and you’ll need to maintain a custom build or pipeline.

### 5. Inline Styles or Style Modules for Key Layout/Spacing

- What it is:Move critical layout and spacing rules (the ones being overridden) into inline styles or into Lit style modules loaded in the shadow root.Example: For top-level spacing elements, use <div style="padding:16px"> so that global resets do not override.
- Why it helps:Inline styles have higher priority than external styles and are less likely to be reset inadvertently.
- Considerations:Overuse of inline styles can degrade maintainability and theming.This works best for limited “fixes,” not a broad redesign.

### 6. Revisit Global Resets on the Adobe Home Side (Likely Not Viable Given Requirements)

- What it is:Adjust the Adobe Home global styling approach to be less aggressive—for instance, removing the universal padding: 0; margin: 0; reset in favor of more selective rules.
- Why it helps:Minimizes collisions with external components.

### Considerations:

- Adobe Home has stated that modifying their global CSS is off the table.
- Not a recommended path given the current constraints.

---

## 5. Recommendations and Next Steps

### 1. Immediate Workaround

- Use stricter shadow DOM encapsulation or increased specificity in the Merch card components to stop global resets from interfering.
- Check which elements are being overridden (e.g., CTA buttons, container padding). Update those styles with higher specificity or inline styles.

### 2. Longer-Term Alignment

- Explore Spectrum Web Components as a more robust, future-proof solution. This would allow Merch cards to benefit from the encapsulation of web components while still following Spectrum’s design standards.
- If rewriting to Web Components is not possible soon, consider a partial approach: scope the CTA button code to a shadow DOM–encapsulated subcomponent that keeps the rest of the Merch card as-is.

### 3. Evaluate Other Solutions

- For short-lifespan integrations or minimal usage, a quick fix (like renaming .spectrum-Button to a custom class in Merch cards) could suffice.
- For broad usage where maintainability matters, scoping or adopting official Spectrum Web Components is more sustainable.

---

## Conclusion

The crux of the issue lies in global CSS overrides from Adobe Home conflicting with the class-based approach of Spectrum CSS in Merch cards. Because the Merch cards must remain “agnostic” to the hosting platform, the best approach is to enhance their encapsulation (via strict shadow DOM usage, increased specificity, or by adopting Spectrum Web Components). By doing so, Merch cards can reliably maintain their design integrity, even when hosted in an environment with aggressive global resets and overrides.



                
        
    
        