# Veil Media Studio

Web / Three.js character creator and media application. Source code is in [`src`](src), the model and texture library is in [`public/assets`](public/assets).

## Download and run

Download **Veil-Media-Studio.zip** from the [latest release](https://github.com/scrsper/veil-media-studio/releases/latest), extract it, and install Node.js 22 or later. In the extracted folder:

```sh
node preview.cjs
```

Open http://127.0.0.1:5186. This complete ZIP contains compiled app files, source, models and textures; no dependency installation is needed for the preview. Choose another port with `node preview.cjs 5187`.

## Clone and edit

Install [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/collaboration-with-git-large-file-storage) before cloning so binary assets download as actual files rather than pointer text.

```sh
git lfs install
git clone https://github.com/scrsper/veil-media-studio.git
cd veil-media-studio
git lfs pull
npm ci
npm run dev
```

Run `npm test` for input/media logic checks and `npm run build` for the compiled app. `npm start` serves the compiled app after building. GitHub's ordinary source ZIP may contain LFS pointers; use the complete release ZIP for a ready-to-run copy.

## Features

- Male/female characters, face/head presets and deterministic random generation with locks.
- Face/body sliders, hair, cosmetics, skin/iris colors and clothing visibility.
- Action previews, secondary motion, eye/head tracking, lighting and camera controls.
- Mouse, keyboard and standard gamepad navigation. [Control guide](INPUT-CONTROLS.txt).
- PNG export in landscape, portrait, square and Ultra HD sizes, with transparent or solid backgrounds.
- Clean stage and saved camera shots. Shot JSON preserves appearance and playback settings, but not an exact simulation frame.

## Project map

| Location | Contents |
|---|---|
| `src/main.ts` | Creator state, model loading and scene integration |
| `src/media-studio.ts` | Image capture and camera-shot persistence |
| `src/creator-input.ts` | Keyboard/controller adapter |
| `public/assets` | Complete local model, texture and settings library |
| `tests` | Input and media regression checks |
| `PROGRESS.md` | Validation and known limits |

## Known limits

Existing art limitations remain, including some skin seams, hair intersections and preset thumbnail differences. Live visual validation and physical-controller acceptance are pending; automated checks are not a substitute for rendering review.


Functional material visibility settings are stored in `src/model-runtime.json` and bundled into the application.
