# Anushka — photo set

Private photos of a minor. Keep the untouched originals in the project root out of
any deployment; only the exports in this folder are meant for the website. Do not
upload or repost them elsewhere.

## What is here

Eleven unique frames: one hero portrait and a ten-photo wall.

| File | Source | Use |
| --- | --- | --- |
| `anushka-01.jpg` / `-640` | `858109933_…` | **Hero** — night portrait, cream kurti |
| `anushka-02.jpg` / `-640` | `851175116_…` | Gallery — pink laugh (landscape) |
| `anushka-03.jpg` / `-640` | `860515490_…` | Gallery — pink hush (landscape) |
| `anushka-04.jpg` / `-640` | `857859316_…` | Gallery — jhumka close-up (landscape) |
| `anushka-05.jpg` / `-640` | `854406980_…` | Gallery — orange peacock lehenga, full length |
| `anushka-06.jpg` / `-640` | `857068609_…` | Gallery — yellow night, big smile, mehndi |
| `anushka-07.jpg` / `-640` | `860017536_…` | Gallery — yellow night, over-the-shoulder |
| `anushka-08.jpg` / `-640` | `858210397_…` | Gallery — yellow day, sunglasses |
| `anushka-09.jpg` / `-640` | `858670489_…` | Gallery — striped tee + floral scarf |
| `anushka-10.jpg` / `-640` | `858006166_…` | Gallery — sticker selfie |
| `anushka-11.jpg` / `-640` | `861124822_…` | Gallery — school uniform selfie |

- Large: 1080 px long edge. Small: 640 px long edge.
- JPEG q82, progressive, sRGB, metadata stripped (no EXIF, GPS or ICC blocks).
- Aspect ratios preserved. The only crop is removal of pure-black letterbox bars
  on 05–09; no face is ever cropped.
- Orientation: `851175116`, `860515490` and `857859316` were stored sideways and
  are rotated 90° counter-clockwise.
- Letterbox trims: 05 `(35, 21)`, 06 `(120, 120)`, 07 `(76, 76)`,
  08 `(128, 98)`, 09 `(76, 76)` pixels top/bottom.
- `photos.json` paths are relative to the project root (`index.html`), so they work
  directly in `src`/`srcset` from the site root.

## Selection notes

- Kept the joyful pink laugh as the gallery lead (`anushka-02`) and matched it with
  the quieter pink frame (`anushka-03`).
- Added the orange full-length lehenga as the signature editorial frame (`-05`),
  two yellow night portraits (`-06`, `-07`), a yellow daytime portrait (`-08`) and
  the striped outdoor look (`-09`).
- Dropped as weaker/redundant: `863464784` (duplicate of `858109933`, pHash distance
  0), `862453135` (soft-focus peace sign), `849411052` (soft, small, 2× upscale),
  `850334924` (soft glam close-up), `855678007` (redundant pink close-up),
  `858251299` (redundant yellow night selfie), `859776183` (blurry low-res),
  `861823020` (strong but redundant yellow night portrait) and `860570049` (calm,
  but plain wall and same outfit as the dropped peace-sign frame).

## Using the focus values

Each `focus` value is a ready-to-use CSS `object-position`, aimed at the face:

```html
<img src="assets/photos/anushka-01.jpg"
     srcset="assets/photos/anushka-01-640.jpg 640w,
             assets/photos/anushka-01.jpg 1080w"
     sizes="(max-width: 640px) 90vw, 420px"
     style="object-position: 72% 36%"
     alt="…">
```

`anushka-02`, `-03` and `-04` are landscape — give them wide tiles (or let them
span two polaroid columns). The rest are portrait and crop cleanly to 4:5.

## Regenerate

From the project root:

```sh
python3 assets/photos/build.py
```

Needs Python 3 + Pillow. Reads the originals in place; removes stale
`anushka-*.jpg` exports and writes only this folder.
