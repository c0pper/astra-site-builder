// What a reviewer must look at in a site.json: shared by REVIEW.md (scripts/review.mjs) and the batch report.
import { siteSchema } from '../../template/schema/site.ts';

const EXTENSION = { automotive: 'automotive', 'food-beverage': 'foodBeverage', fitness: 'fitness', trades: 'trades' };
const WEIGHT = { verified: 1, high: 1, medium: 0.6, low: 0.2 };
const GENERIC_WEIGHT = 0.3;

export function analyseSite(site) {
  const ext = EXTENSION[site.category];
  const blocks = [
    ['business', siteSchema.shape.business.shape, site.business],
    [ext, siteSchema.shape[ext].unwrap().shape, site[ext]],
    ['retail', siteSchema.shape.retail.unwrap().shape, site.retail],
  ];
  // Facts present in the file, in schema order, with their values; absent fields of the core and own extension.
  const facts = [];
  const missing = [];
  for (const [prefix, shape, values] of blocks) {
    for (const key of Object.keys(shape)) {
      const value = values?.[key];
      if (value === undefined) {
        if (prefix !== 'retail') missing.push(`${prefix}.${key}`);
      } else {
        facts.push({ path: `${prefix}.${key}`, value, source: site.sources[`${prefix}.${key}`] });
      }
    }
  }

  const services = site[ext]?.services ?? [];
  const generic = services.filter((s) => s.generic).map((s) => s.name);
  const checkFirst = facts.filter((f) => f.source && ['low', 'medium'].includes(f.source.confidence));
  const singleSource = facts.filter((f) => f.source?.confidence === 'high' && f.source.urls.length === 1);

  // 0–100: mean confidence weight over the facts; an all-generic service list counts as one weak fact.
  const weights = facts.map((f) => (f.source ? WEIGHT[f.source.confidence] : GENERIC_WEIGHT));
  const confidence = weights.length ? Math.round((100 * weights.reduce((a, b) => a + b, 0)) / weights.length) : 0;

  return { ext, facts, missing, services, generic, checkFirst, singleSource, confidence };
}
