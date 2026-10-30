# Food & Beverage tone guide

Applies to: `restaurant`, `bakery`, `pastry-shop`. Read with the content rules in the root `CLAUDE.md`: copy states only facts that have a source in `site.json`.

## Voice

**Warm, welcoming, local.** The reader is choosing where to eat or what to pick up and wants to know fast: *what kind of food, where you are, when you're open, how to book*. Write like the host greeting someone at the door: friendly and concrete, never a food critic.

- Address the reader as **tu**; use "noi" for the business ("ti aspettiamo", "prepariamo").
- Short sentences. Name real dishes and places: *genovese, ragù, Santa Chiara, centro storico*. The sensory pull comes from naming a sourced dish, not from adjectives.
- Mention the town and neighbourhood: people search "ristorante + zona".

## Copy fields

| Field | Length | Shape |
|---|---|---|
| `copy.headline` | ≤ 7 words | What + where: "Cucina napoletana a Santa Chiara", "Il tuo panificio a Portici". Uses the sourced cuisine or the sub-type label |
| `copy.tagline` | ≤ 15 words | One or two sourced specialities or services + how to reach you ("Prenota un tavolo per telefono") |
| `copy.about` | 2–3 short paragraphs | Who they are, what they cook, where, built only from sourced facts. If research found little, write 2 sentences rather than padding |
| `specialities[].description` | ≤ 15 words, optional | What the dish is, only as a source describes it. Omit rather than invent ingredients |
| `seo.title` | ≤ 60 chars | Default `<Name> – <Label> a <Città>` is usually best; leave unset |
| `seo.description` | ≤ 155 chars | Name, cuisine, where, how to book |

## Claims that need a source

Each of these appears only when `site.json` holds it with a source: dishes and ingredients, cuisine style ("napoletana", "di mare"), *fatto in casa*, *pasta fresca*, *a km 0*, *biologico*, *ingredienti freschi / di stagione*, *ricette della nonna*, family-run or generations, years open or founding date, chef names, guide listings and awards (Michelin, Gambero Rosso, Slow Food), prices and fixed menus, vegetarian/vegan/gluten-free options, take-away, delivery, outdoor tables, booking channels.

Leave the rating and review count out of the copy: the reviews section shows them from `business.rating`. Never quote or paraphrase reviews, and a dish praised only in reviews is a `low` confidence speciality: say so in its source note.

Words that read as claims: *autentico, genuino, tradizionale, tipico, il migliore, imperdibile, squisito, delizioso*. Describe what's on the plate and where it is, not how good it is.

## Examples

Good, from a sourced listing with cuisine "Napoletana", a speciality "Genovese" and a phone:

> **Cucina napoletana a Santa Chiara**
> Genovese e cucina napoletana nel centro storico. Prenota un tavolo per telefono.

Rewrite: unsourced claims.

> ~~Da tre generazioni la vera cucina della nonna, con ingredienti freschi e genuini.~~
