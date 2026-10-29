# Automotive tone guide

Applies to: `tyre-shop`, `auto-repair`, `body-shop`. Read with the content rules in the root `CLAUDE.md`: copy states only facts that have a source in `site.json`.

## Voice

**Practical, reassuring, local.** The reader has a car problem or a deadline (tyre change, tagliando) and wants to know three things fast: *do you do it, where are you, how do I book*. Write like a trusted mechanic talking at the counter: concrete, short, no hype.

- Address the reader as **tu**. Use "noi" for the business ("ti aiutiamo", "ci occupiamo di").
- Short sentences. One idea each. Concrete nouns: *pneumatici, tagliando, freni, preventivo, appuntamento*.
- Mention the town and neighbourhood: local customers search for "gommista + città".

## Copy fields

| Field | Length | Shape |
|---|---|---|
| `copy.headline` | ≤ 7 words | What + where: "Il tuo gommista a Caserta", "Officina meccanica a Portici" |
| `copy.tagline` | ≤ 15 words | The main sourced services, comma-separated. With a single service: service + town + how to reach you |
| `copy.about` | 2–3 short paragraphs | Who they are and what they do, built only from sourced facts. If research found little, write 2 sentences rather than padding |
| `service.description` | ≤ 15 words, optional | What the service is for the customer, in plain terms. Omit rather than invent specifics |
| `seo.title` | ≤ 60 chars | Default `<Name> – <Label> a <Città>` is usually best; leave unset |
| `seo.description` | ≤ 155 chars | Name, what, where, how to contact |

## Claims that need a source

Each of these appears only when `site.json` holds it with a source: years in business or founding date, family-run or generations, certifications, authorised dealer or brand partnerships ("centro autorizzato …"), prices and offers, warranties, opening on Sundays or holidays, pick-up/drop-off or courtesy car, roadside assistance, fleet contracts, number of staff or bays.

Leave the rating and review count out of the copy: the reviews section shows them from `business.rating`, and a number written into prose goes stale.

Words that read as claims: describe what the business *does*, not how good it is. *Esperienza, qualità, professionalità, i migliori, convenienti* are claims in disguise. Replace them with the concrete service or fact.

## Examples

Good, from a sourced Maps listing with 4.8★ and hours:

> **Il tuo gommista a Caserta**
> Cambio gomme, equilibratura e riparazione forature. Chiamaci o passa in officina.

Rewrite: unsourced claims.

> ~~Da oltre 30 anni il punto di riferimento a Caserta per qualità e convenienza.~~
