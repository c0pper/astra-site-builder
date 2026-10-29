// Reports which registry sub-types are ready (image pack + tone guide + theme preset). Exits 1 if any are not.
import { SUBTYPE_IDS, SUBTYPES } from '../template/registry.ts';
import { missingAssets } from '../template/lib/readiness.ts';

let notReady = 0;
for (const id of SUBTYPE_IDS) {
  const missing = missingAssets(id);
  if (missing.length) notReady++;
  console.log(`${missing.length ? '✗' : '✓'} ${id.padEnd(20)} ${SUBTYPES[id].category.padEnd(14)} ${missing.join(', ')}`);
}
console.log(`\n${SUBTYPE_IDS.length - notReady}/${SUBTYPE_IDS.length} sub-types ready.`);
process.exit(notReady ? 1 : 0);
