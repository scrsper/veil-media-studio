"""Package the app with one asset-library copy and verify every archive member."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
output = root / 'Veil-Media-Studio.zip'
files = []
for folder in ['src', 'public', 'tests', 'scripts']:
    files.extend(f for f in (root / folder).rglob('*') if f.is_file() and not f.name.endswith('-bundle.mjs'))
files.extend(f for f in root.iterdir() if f.is_file() and f.name not in {output.name, 'PACKAGE-VALIDATION.json'} and f.suffix != '.log')
# Vite duplicates public/assets into dist: retain only the compiled app in dist.
files.extend(f for f in (root / 'dist').rglob('*') if f.is_file() and not (root / 'public' / f.relative_to(root / 'dist')).exists())
manifest = {}
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=4) as archive:
    for f in sorted(set(files)):
        rel = f.relative_to(root).as_posix()
        data = f.read_bytes()
        archive.writestr('veil-media-studio/' + rel, data)
        manifest[rel] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    archive.writestr('veil-media-studio/PACKAGE-MANIFEST.json', json.dumps(manifest, indent=2))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for rel, item in manifest.items():
        assert hashlib.sha256(archive.read('veil-media-studio/' + rel)).hexdigest() == item['sha256'], rel
report = {'archive': output.name, 'entries': len(manifest) + 1, 'bytes': output.stat().st_size,
          'sha256': hashlib.file_digest(output.open('rb'), 'sha256').hexdigest(), 'allMemberHashesVerified': True}
(root / 'PACKAGE-VALIDATION.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
