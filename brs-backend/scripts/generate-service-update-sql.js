// One-off helper: reads service-descriptions.json and emits a SQL file with
// parameterized-safe UPDATE statements (single quotes doubled per Postgres
// escaping rules) to backfill detailed legal content into services.description.
// Usage: node generate-service-update-sql.js > update-services.sql
const fs = require('fs');
const path = require('path');

const descriptions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'service-descriptions.json'), 'utf8')
);

function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

const lines = ['BEGIN;'];
for (const [slug, description] of Object.entries(descriptions)) {
  lines.push(
    `UPDATE services SET description = '${sqlEscape(description)}', updated_at = now() WHERE slug = '${sqlEscape(slug)}';`
  );
}
lines.push('COMMIT;');

const outPath = path.join(__dirname, 'update-services.sql');
fs.writeFileSync(outPath, lines.join('\n') + '\n', { encoding: 'utf8' });
console.error('Wrote', outPath);
