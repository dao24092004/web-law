import sys, json
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    d = json.load(f)
for l in d['data']['content']:
    n = (l.get('nameVi') or '').lower()
    slug = (l.get('slug') or '').lower()
    if 'huy' in n or 'huyen' in slug or 'thị' in n:
        sys.stdout.buffer.write((json.dumps(l, indent=2, ensure_ascii=False) + '\n---\n').encode('utf-8'))
