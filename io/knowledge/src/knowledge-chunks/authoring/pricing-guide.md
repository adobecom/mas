# Adding Prices to Merch Cards

## Overview

Prices in MAS Studio are added through the **Offer Selector Tool (OST)**, not by typing text. The OST ensures accurate, localized pricing that updates automatically.

**You cannot type prices directly - you MUST use the OST button (shopping cart icon).**

---

## How to Add a Price in MAS Studio

### Step 1: Open Your Card in the Editor

1. Navigate to your card in MAS Studio
2. Click the card to open the right-side editor panel
3. Locate the **Prices** field

### Step 2: Click the OST Button

1. In the toolbar, click the **shopping cart icon** (Offer Selector Tool)
2. The OST modal opens

### Step 3: Search and Select an Offer

1. Search by product name (e.g., "Photoshop", "Creative Cloud All Apps")
2. Filter by:
   - **Segment**: Individual, Team, Student, Enterprise
   - **Commitment**: Monthly, Annual
3. Review offer details:
   - Pricing information
   - Valid countries and locales
   - Availability dates
4. Click the offer to select it

### Step 4: Configure Display Options

Before inserting, configure how the price displays:
- **Display old price**: Show strikethrough for sales
- **Display per unit**: Show "per license" for team pricing
- **Display recurrence**: Show "/mo" or "/yr"
- **Display tax**: Include tax information

### Step 5: Insert the Price

1. Click **"Insert"**
2. The price appears in your field
3. Preview your card to see the formatted price

---

## Why You Cannot Type Prices Directly

MAS Studio does NOT allow typing prices like "$9.99" because:

- Prices change constantly (promotions, regional pricing)
- Static text shows the wrong currency for different regions
- Static prices cause checkout errors
- Only the commerce system has accurate, up-to-date pricing

**The shopping cart button (OST) is the ONLY way to add prices.**

---

## Currency and Locales

- Currency is determined automatically by the card's locale (e.g., US cards show USD, Germany shows EUR)
- You cannot manually change the currency
- For different regions, create locale variations of your card

---

## Troubleshooting

### OST Button Not Visible
- Make sure you're clicking in a pricing field
- Some fields (like plain title) don't support pricing

### Can't Find My Product in OST
- Check if the offer is available for your locale
- Try searching by product name instead of code
- Ask in #merch-at-scale Slack if the offer isn't showing

### Price Not Showing on Preview
- Make sure you clicked "Insert" after selecting the offer
- The offer might not be valid for your card's locale
- Check if the offer's start date has passed

### Price Shows Wrong Currency
- Currency follows the card's locale automatically
- Create your card in the correct locale folder
- Create a locale variation for different regions
