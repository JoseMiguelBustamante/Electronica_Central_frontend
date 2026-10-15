---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Always draw the Ficha de mostrador first, with Color, Tipografía, Espacio, radio y foco, Botones, Campos, and Badges, and do not start any other screen until that board exists. Then deliver the brief's screens as separate full-scroll boards, including the next step, the blocked path, and loading, empty, and error. Helps with aesthetic direction, typography, and choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from — a design for a toy for girls aged 8–11 will be very aesthetically different from a dashboard for financial analysts. Build with the brief's real content and subject matter throughout.

## Deliver the brief whole

A short sample of the first screen is not the deliverable. The first artboard is always the Ficha de mostrador. Do not start any other screen until that board is complete.

Match the reference sheet `Electrónica Central AZ — Ficha de mostrador.html`, the page titled Tokens de interfaz. The format is a design-system sheet of cards and grids. A vertical list of token rows is not this sheet.

The board is 1440 px wide and 2500 px tall, background #E4E8E1, padding 64 px top and bottom and 80 px on the sides, a column with 56 px between blocks, left aligned. Interface type is Schibsted Grotesk. Code, price, and stock use Spline Sans Mono with tabular figures. Cards are surface #F6F7F3, 1 px line #D2D8CE, radius 10.

Header, one row, space between, aligned to the end, with a 1 px line under it and 32 px of padding below that line:
- Left column, 12 px between lines: "Electrónica Central AZ" at 20 px weight 700 in #1A4636; the title "Tokens · ficha de mostrador" at 44/50 weight 700; then one sentence at 16/24 in #5E6A62, max 720 px: "Fibra de vidrio clara, pista de cobre y máscara verde. Los mismos botones, campos y badges sirven a la tienda pública y al panel interno."
- Right: a meta card, padding 16×20, a two-column definition list in mono 12/18. Labels in #5E6A62, values in ink. Rows: Versión / v1 · 2026-10-10, Tema / Solo claro, Moneda / Bs · 2 decimales · coma, Contraste / WCAG 2.1 AA.

Every section opens on one baseline, 16 px between items: the number 01–06 in mono 13 weight 600 color #8E4B24, the title at 26/32 weight 600, and a note at 14 px in #5E6A62. Then the samples, 20 px below that baseline.

1. Color. Note: "Contraste medido sobre superficie #F6F7F3 · * derivado para cumplir AA". A grid of six columns, gap 16. Each color is a card: a 72 px swatch with a 1 px line under it, then padding 12 and a 4 px stack of name (14/600), hex and contrast in mono, and the use in secondary text. Twelve cards, in order: Fondo #E4E8E1 lienzo; Superficie #F6F7F3 tarjetas, campos y barras; Línea #D2D8CE divisores, not for text; Borde de campo * #849088 · 3,1:1; Texto #1B2420 · 14,8:1; Texto secundario #5E6A62 · 5,3:1; Cobre #8E4B24 · 6,4:1 precio y botón principal, blanco encima 6,9:1; Cobre presionado * #77401F hover y activo; Verde máscara #1A4636 · 9,9:1 marca, ítem activo y foco; Disponible #1F7A4A · 5,0:1 solo badge, fondo #E1ECE4; Poco stock #A56A12 · 4,2:1 solo ícono y borde, el texto va en #1B2420; Agotado #8C342C · 7,4:1 badge, error y anular.
2. Tipografía. Note names both families. Two cards side by side, padding 8×24. Each specimen is a row with a 1 px divider: a 170 px mono label "rol · tamaño/interlínea · peso" in #5E6A62, then the sample. Left: Display 32/38/700 Electrónica Central AZ; Título 1 24/30/600 Arduino Uno R3 compatible; Título 2 19/26/600 Especificaciones; Cuerpo 15/22/400 "La solicitud no aparta unidades; la compra se cierra en tienda."; Pequeño 13/18/500 the store hours in #5E6A62; Etiqueta 12/16/600 "Placas Arduino · Compatible" in small caps tracking. Right, mono samples: Precio L 28/34/600 Bs 95,00 in copper; Precio M 17/22/600 Bs 2,50 in copper; Total 22/28/600 Bs 1.284,50; Código 13/18/500 ARD-UNO-R3 · IC-NE555-DIP; Stock 14/20/500 as two rows of three mono cells: 118, mín, 20 and 4, mín, 5.
3. Espacio, radio y foco. Three cards, padding 20×24. First, "Espaciado · base 4": squares of 4, 8, 12, 16, 24, 32, 48 with the number under each. Second, "Radios": a 64×44 control at radius 6, a 64×44 card at radius 10, and a 64×28 pill at radius 999, each labeled. Third, "Foco y área táctil": a 44 px field reading "Foco visible", border #849088, and a 2 px #1A4636 ring 2 px outside it, plus the sentence "Anillo 2 px #1A4636, separación 2 px. Mínimo 44 × 44 px en todo control."
4. Botones. Note: "Alto 44 px · un solo botón cobre por paso". One card, padding 8×24, that is a table. Columns, in mono 12 #5E6A62: Variante (220 px), Reposo, Hover, Foco, Deshabilitado, Uso. Rows divided by a 1 px line: Principal, Secundario, Texto, Peligro. Each state is a real 44 px button, radius 6, weight 600, 15 px. Principal "Solicitar": rest #8E4B24 on white, hover #77401F, focus the rest color plus the ring, disabled fill #D2D8CE and text #5E6A62. Uso: "Solicitar, Confirmar venta, Confirmar pago". Secundario "Ingresar": rest surface with a 1 px #1A4636 border and mask text, hover fill #DDE6E1, focus adds the ring, disabled border #D2D8CE and text #5E6A62. Uso: "Acción alternativa del mismo paso". Texto "Quitar filtros": rest transparent mask text, hover fill #DDE6E1 and underline, focus adds the ring, disabled text #849088. Uso: "Acciones de bajo peso, navegación". Peligro "Anular venta": rest surface with a 1 px #8C342C border and that text, hover fill #F3E2DF, focus adds the ring, disabled border #D2D8CE and text #5E6A62. Uso: "Anular, cancelar compra, ajustar. Siempre con confirmación".
5. Campos. Note: "Etiqueta siempre visible arriba · alto 44 px · error con ícono y texto". One card, padding 24, a grid of four columns, column gap 24, row gap 28. Eight fields, label 13/600 above, control 44 px, radius 6, and a 12 px caption under it. Usuario o correo at rest, placeholder "ej. lucia.mamani", border #849088, caption Reposo. The same field focused, value "lucia.mamani", border and outer ring #1A4636, caption Foco. Contraseña empty with a 2 px #8C342C border and the error "Ingresa tu contraseña." in #8C342C with an icon. Ubicación disabled, label and value "Estante B-03" in #5E6A62, fill #E4E8E1, border #D2D8CE, caption Deshabilitado. Buscar with a leading icon and placeholder "Nombre o código (ej. NE555)", caption Buscador. Categoría as a select showing Módulos, with Placas Arduino and Integrados as the other options, caption Selector. Cantidad as a 168 px stepper, minus and plus around the mono value 3, caption "Entero, mínimo 1". Monto a cobrar: a field with "Bs" and the mono value 47,50 aligned right, caption "Paso de 0,50 · saldo Bs 47,50".
6. Badges. Note: "Siempre ícono + texto. El color nunca va solo. Texto en #1B2420." Four cards, padding 20, gap 14. Each card title is 12/600, tracked, uppercase, in #5E6A62. Pills are 28 px, radius 999, icon plus the word in ink. Tienda, stacked: Disponible on #E1ECE4 border #9CC2AA, Poco stock on #F4EAD8 border #D4B07A, Agotado on #F3E2DF border #CC9A93. Caption: "Sin cantidad. Poco stock = queda mercancía en el mínimo o debajo." Panel: the same three pills, and to the right the mono figures 18 / mín 5, 4 / mín 5, and 0 / mín 3. Caption: "Mismo badge; cantidad y mínimo en mono a la derecha." Venta: Borrador on #EBEEE8 with a dashed #849088 border, Confirmada on #DDE6E1 border #8FA89C, Entregada on #E1ECE4 border #9CC2AA, Anulada on #F3E2DF border #CC9A93. Caption: "Borrador no mueve stock. Confirmada descuenta stock." Pago: Pendiente on #F4EAD8 border #D4B07A, Confirmado on #E1ECE4 border #9CC2AA, Rechazado on #F3E2DF border #CC9A93, then the mono chips EFECTIVO and QR with the words "método junto al estado". Caption: "Todo pago nace Pendiente. Solo Confirmado baja el saldo."

When the brief names a batch, draw every remaining item as its own artboard, in that order, only after the ficha. Also draw loading, empty, and error for each key view the brief names. Each artboard is a web screen, 1440 px wide and as tall as the full scroll. Do not draw a phone frame, a 390 px board, or a separate mobile layout.

For a public catalog, the screens after the ficha are:

1. The catalog at 1440 px, tall enough for the whole scroll.
2. The screen the main action opens, such as the product detail.
3. The path when that action needs a session and the person has none.
4. The catalog while loading, with no results, and when the request fails.

The catalog artboard shows the identity, the session action, and the operational fact the brief gives, such as hours, place, or currency. It shows search, the main taxonomy as a horizontal set of choices that includes all, and the other filters as their own controls. It shows a window of results and the total of the catalog, not a count of the rows on the board. It shows sort, enough rows to display every status, a way to see more, a way to ask for an item that is not listed, and the navigation to the other customer destinations the brief names.

Use the brief's palette, type, and words. If the user points at an HTML or image made from the same brief, match its boards and the information on them. A shorter list is not a valid reading of that reference.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment, or other treatments. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option.

Typography carries the personality of the page. You don't need a different typeface for display or headline text and body content: use one family or two, and if two, make them clearly distinct.

Choose your typefaces deliberately, not the default families you would reach for on any other project, and set a clear type scale following the default guidance of The Elements of Typographic Style with intentional weights, widths, and spacing. When type is used as a headline or visual element, use the type treatment itself as an active part of the design, not a neutral delivery vehicle for the content.

Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths; give serif body text slightly more line-height than a sans-serif.

Avoid these default typographic treatments; they are the commonest tells of a generated page:
- Accenting just a single word or phrase in a headline, like putting one word in italic/bold or a different color.
- Using all caps for labels.
- Adding unnecessary typographic labels above content.

Visual structure is information. Structural devices like outlines, borders, numbering, eyebrows, dividers, labels, etc., encode useful information about the content rather than decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence — like a stepped process or a timeline. Before adding numbered markers, check the content really is a sequence.

Use non-user-triggered motion sparingly and deliberately, only to draw attention. A single orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated. Motion that answers a person's action (opening, expanding, confirming) is welcome when it shows what changed.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy and placeholder content. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: plan, review against the brief, build, critique

For calibration, AI-generated design right now clusters around some traits:
1. a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's brief it reads as a tell);
2. a near-black background with a single bright acid-green or vermilion accent;
3. a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns;
4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes as decoration;
5. template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots ('A · B · C'); labels built as 'WORD — fragment' with a spaced em dash; tinted near-black (#0B0B0B, #111) standing in for black; a monospace face for small data labels; a '→' appended to link and button text.

All traits are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. As with a hired human designer, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the client's design brief: create a compact token system with color, type, layout, and principles.
- Color: describe the core base palette as 4–6 named hex values.
- Type: the typefaces and their roles.
- Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Include alignment guidance; should the content be left aligned, center aligned, justified?
- Principles: the high-level guidance for what makes this page unique.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and an element-based selector like .cta). This can happen often with padding/margin between sections.

## Restraint and self-critique

Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut decoration that does not serve the brief. Keep every control, count, state, and path the brief names. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes. Critique your own work as you build, taking screenshots to review if your environment supports it — a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creatives have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand and use. They are design content, not decoration. Bring the same intentionality and minimalism to copywriting that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's perspective. Name things by what users will understand in simple language, not by how the system is built. A user manages notifications, not webhook config. Describe what something is or does in plain terms rather than selling it. Being specific and legible to new users is always better than being clever.

Use active voice as default. A CTA says exactly what happens when it is used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the tone conversational: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each written element do exactly one job.
