# GitHub application package — 2026-10-21

Prepared a separate publishing checkout with the complete Veil Media Studio source and the metadata-externalized editing copies. Original runtime app, original model library and earlier archives remain unchanged.

Attribution documents accompany the copied models at the repository root. ASSET-REGISTRY.json reflects the files actually shipped here. Optional source/exporter metadata lives in those documents; the geometry, rig, morphs and textures remain the existing assets.

The app retains its previous creator features and media tools. Existing skin seams, hair intersections and thumbnail differences remain. Browser render verification and a physical controller test are pending. Input tests simulate a standard browser gamepad; media tests use a mocked renderer.

Run `npm ci`, `npm run verify:assets`, `npm test`, then `npm run build`. The complete release ZIP includes compiled preview files and one copy of the asset library. Large binary assets are stored with Git LFS in the repository.

## Packaging validation

Verified all 792 assets and all 229 model-to-attribution mappings against actual SHA-256 values. All external image/buffer references resolve. The 25 simulated input checks, 11 media logic checks, TypeScript check and production build pass. A credential-pattern scan of application/test sources found no matches. Runtime Three.js and KawaiiPhysics license notices are included.

## GitHub publication

Private repository: https://github.com/scrsper/veil-media-studio. Initial source and full LFS library upload succeeded. Included the existing standalone hair-gallery files as well as the main creator. A complete release ZIP is prepared separately from GitHub's source archive.
