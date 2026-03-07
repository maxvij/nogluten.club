# nogluten.club — Claude Code context

## Project
Personal recipe site for Max (Senior Product Designer, Auckland NZ).
All recipes must be gluten-free and lactose-free. Protein-focused: 75kg bodyweight, 120–150g/day target.

## Stack
- Single `index.html` — vanilla HTML/CSS/JS, no build step, no dependencies
- Hosted on GitHub Pages with custom domain (nogluten.club)
- Open directly in browser; no server needed

## Design
- Dark/light theme toggle (default: light), preference stored in localStorage
- Typography: Playfair Display (headings/titles), DM Mono (meta/labels), DM Sans (body)
- Colour system: warm neutrals + 4 category accents (gold, green, terracotta, blue)
- All colours use CSS custom properties — never hardcode hex/rgba values directly

## Recipe data
Recipes live in `const recipes` at the top of the `<script>` block, structured as:
```js
recipes = {
  breakfast: [ { title, desc, time, protein, kcal, ingredients: [{amount, item}], steps: [], tips } ],
  lunch: [...],
  dinner: [...],
  snack: [...]
}
```
To add a recipe: add an object to the correct category array. The UI renders automatically.
Section counts are dynamic — no need to update them manually.

## Rules
- No gluten ingredients (no wheat, barley, rye, regular soy sauce — use tamari)
- No lactose (no regular dairy — use lactose-free yogurt, coconut milk, oat milk etc.)
- No emojis in UI copy
- No frameworks, no build tools, no external JS
- All interactive elements (buttons, inputs, checkboxes, links) must have a minimum height/touch target of 40px
