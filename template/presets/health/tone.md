# Health tone guide

Applies to: `psychologist`. Read with the content rules in the root `CLAUDE.md`: copy states only facts that have a source in `site.json`.

## The rule that shapes everything

Health professionals (psychologists included, since L. 3/2018) may advertise only **informative** content: who they are, titles and specialisations, what they do, where and how to reach them. Anything promotional or suggestive is out (L. 145/2018, art. 1 c. 525; codice deontologico degli psicologi, art. 40). So the page informs and never persuades. The schema enforces part of it: health sites have no rating and no reviews section.

## Voice

**Calm, plain, respectful.** The reader may be going through a hard moment and wants to know: *who you are, what you work on, where you see people, how to get in touch*. Write as the practitioner introducing themselves, never as a marketer.

- An individual practitioner speaks in the **first person singular** ("sono", "mi occupo di", "ricevo"): set `copy.voice` to `"i"`, which also turns "Chi siamo" into "Chi sono". A studio associato keeps `"we"`.
- Address the reader as **tu**, gently ("puoi contattarmi"); never pressure ("non aspettare", "chiama subito").
- Use the practitioner's sourced title with its grammatical gender: "psicologa", "psicoterapeuta".
- Mention the town and neighbourhood: people search "psicologo + zona".

## Copy fields

| Field | Length | Shape |
|---|---|---|
| `copy.headline` | ≤ 7 words | Title + where: "Psicologa e psicoterapeuta a Napoli" |
| `copy.tagline` | ≤ 15 words | Who they work with or the approach, as sourced: "Psicoterapia sistemico relazionale per individui, coppie e famiglie" |
| `copy.about` | 2–3 short paragraphs | Who they are, approach, who they work with, where they see people: only sourced facts. A short self-description the practitioner published (on a directory profile they wrote) may be paraphrased closely; never extend it |
| `services[].description` | ≤ 15 words, optional | Only as a source describes the service |
| `seo.title` | ≤ 60 chars | Default `<Name> – <Title> a <Città>` is usually best; leave unset |
| `seo.description` | ≤ 155 chars | Name, title, approach, where |

## Claims that need a source

Each of these appears only when `site.json` holds it with a source: the title, and above all **psicoterapeuta**, which is a protected title (a specialisation annotated in the Albo); Albo registration and its number; degrees, schools and specialisations; approaches (sistemico relazionale, cognitivo comportamentale); who they work with (adulti, coppie, adolescenti); areas of work; online sessions; languages; years of experience; university or hospital collaborations; agreements with insurers.

Never in copy, even when sourced:
- **Prices**, including "primo colloquio gratuito" (a promotional offer). Directory profiles show prices: leave them there.
- **Promised results** or outcomes: *superare, guarire, risolvere, stare meglio, ritrovare la serenità*. Say what the practitioner works on, not what the reader will achieve.
- **Ratings, reviews, testimonials**, client counts.
- Superlatives and reassurance claims: *il migliore, esperto, specialista* (unless it's the sourced title), *risultati garantiti, in poche sedute, ti capisco*.
- Diagnoses addressed to the reader ("se soffri di ansia…"). List areas as areas.

## Examples

Good, from a sourced profile with title "Psicologa psicoterapeuta", specialisation "Psicoterapia sistemico relazionale" and an address in Via Foria:

> **Psicologa e psicoterapeuta a Napoli**
> Psicoterapia sistemico relazionale per individui, coppie e famiglie, in via Foria.

Rewrite: promotional and suggestive.

> ~~Ritrova la serenità in poche sedute. Primo colloquio gratuito!~~
