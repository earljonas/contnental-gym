DESIGN SYSTEM — apply consistently across all components:

Use the existing design tokens and components already in the project. 
Never hardcode colors — use CSS variables (bg-background, bg-card, 
text-foreground, text-muted-foreground, border-border).

The one exception is the gold accent which must always be #C9973E.

Reuse existing components: Button, Input, Card, Badge, Table components 
from @/components/ui/. Never recreate what already exists.

Border radius: rounded-2xl for cards and containers, rounded-xl for 
inputs and buttons, rounded-full for pills and badges only.

Typography: font-display font-black uppercase tracking-tight for all 
headings. Small labels use uppercase tracking-[0.18em] text-muted-foreground.

Cards always have: rounded-2xl border border-border bg-card.
No box shadows on dark backgrounds — border provides the separation.

Empty states: rounded-2xl border border-dashed border-border, 
centered text, primary message + secondary helper text below it.

Spacing: space-y-6 or space-y-8 between page sections. 
Consistent p-4 to p-6 for card internal padding.

Status colors: emerald for success, amber for warning, red for error.
Always use the /10 background and /30 border opacity variants.