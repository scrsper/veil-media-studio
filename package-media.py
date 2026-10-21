"""Package one asset-library copy losslessly, under 500 MB, and verify contents."""
from pathlib import Path
import hashlib
import io
import json
import tarfile

root = Path(__file__).resolve().parent
output = root / 'Veil-Media-Studio.tar.xz'
files = []
for folder in ['src', 'public', 'tests', 'scripts']:
    files.extend(f for f in (root / folder).rglob('*') if f.is_file() and not f.name.startswith('.') and not f.name.endswith('-bundle.mjs'))
files.extend(f for f in root.iterdir() if f.is_file()
             and (not f.name.startswith('.') or f.name in {'.gitattributes', '.gitignore'})
             and f.name not in {'PACKAGE-VALIDATION.json', 'PACKAGE-MANIFEST.json'}
             and not f.name.endswith(('.zip', '.tar.xz', '.log')))
# Preview serves public/assets as a fallback; omit duplicate dist assets.
files.extend(f for f in (root / 'dist').rglob('*') if f.is_file()
             and not (root / 'public' / f.relative_to(root / 'dist')).exists())
manifest = {}
seen = {}
with tarfile.open(output, 'w:xz', preset=9) as archive:
    for f in sorted(set(files)):
        rel = f.relative_to(root).as_posix()
        data = f.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        manifest[rel] = {'bytes': len(data), 'sha256': digest}
        info = archive.gettarinfo(str(f), arcname='veil-media-studio/' + rel)
        if digest in seen:
            info.type = tarfile.LNKTYPE
            info.linkname = seen[digest]
            info.size = 0
            archive.addfile(info)
        else:
            seen[digest] = info.name
            archive.addfile(info, io.BytesIO(data))
    data = json.dumps(manifest, indent=2).encode()
    info = tarfile.TarInfo('veil-media-studio/PACKAGE-MANIFEST.json')
    info.size = len(data)
    info.mode = 0o644
    archive.addfile(info, io.BytesIO(data))
assert output.stat().st_size < 500_000_000, 'Archive exceeds the requested 500 MB limit'
verified = {}
with tarfile.open(output, 'r|xz') as archive:
    for member in archive:
        if member.name.endswith('/PACKAGE-MANIFEST.json'):
            continue
        rel = member.name.removeprefix('veil-media-studio/')
        item = manifest[rel]
        if member.islnk():
            assert verified[member.linkname] == item, rel
        else:
            data = archive.extractfile(member).read()
            assert len(data) == item['bytes'], rel
            assert hashlib.sha256(data).hexdigest() == item['sha256'], rel
        verified[member.name] = item
assert len(verified) == len(manifest)
(root / 'PACKAGE-MANIFEST.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
with output.open('rb') as stream:
    digest_state = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        digest_state.update(block)
    digest = digest_state.hexdigest()
report = {'archive': output.name, 'entries': len(manifest) + 1,
          'bytes': output.stat().st_size, 'sha256': digest,
          'allMemberHashesVerified': True, 'lossless': True,
          'format': 'tar.xz', 'under500DecimalMB': True}
(root / 'PACKAGE-VALIDATION.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
