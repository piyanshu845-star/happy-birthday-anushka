#!/usr/bin/env python3
"""Build the web-ready Anushka photo set.

Run from the project root:  python3 assets/photos/build.py

- Reads the private originals from the project root (never modifies them).
- Rotates sideways frames 90 deg counter-clockwise.
- Trims pure-black letterbox bars only (top/bottom), never faces.
- Drops the duplicate 863464784 (perceptually identical to 858109933).
- Strips all metadata, exports sRGB progressive JPEGs at q82:
  * 1080 px long edge  -> anushka-NN.jpg
  *  640 px long edge  -> anushka-NN-640.jpg
- Removes stale anushka-*.jpg exports first, then writes photos.json.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

# Narrative order: hero first, then the ten gallery frames.
# (source, caption, alt, focus, rotate_ccw, letterbox_crop(top, bottom))
PHOTOS = [
    (
        "858109933_1803930780824758_4106147694595023423_n.jpg",
        "Sixteen looks good on you.",
        "Anushka in a cream embroidered kurti and silver hoop earrings, smiling under warm lights at night.",
        "72% 36%",
        False,
        None,
    ),
    (
        "851175116_1784667602859637_2801457798050522453_n.jpg",
        "That laugh could light up the whole street.",
        "Anushka laughing in a bright pink mirror-work outfit, hand near her face, silver jewellery catching the light.",
        "63% 38%",
        True,
        None,
    ),
    (
        "860515490_29622717770663956_8131703941440241313_n.jpg",
        "A quiet moment in full colour.",
        "Anushka in a pink mirror-work outfit and silver jewellery, eyes soft, adjusting her headpiece.",
        "66% 42%",
        True,
        None,
    ),
    (
        "857859316_1646018300390831_6938141982181148269_n.jpg",
        "Jhumkas, and a smile to match.",
        "Close-up of Anushka in a black and gold outfit, touching a large silver jhumka earring.",
        "64% 30%",
        True,
        None,
    ),
    (
        "854406980_1143358331949918_4398508195250395424_n.jpg",
        "Peacock hour.",
        "Anushka in a full-length orange peacock-pattern lehenga, looking back over her shoulder in a garden lit for the evening.",
        "50% 34%",
        False,
        (35, 21),
    ),
    (
        "857068609_1464136238969486_7569037955405628719_n.jpg",
        "Mehndi, marigold, and that smile.",
        "Anushka smiling widely in a yellow lehenga at night, mehndi visible on her hand, warm lights behind her.",
        "57% 33%",
        False,
        (120, 120),
    ),
    (
        "860017536_1985893262098025_3102661764379691205_n.jpg",
        "A look back, all lit up.",
        "Anushka in a yellow lehenga looking back over her shoulder on a lamp-lit garden path at night.",
        "50% 35%",
        False,
        (76, 76),
    ),
    (
        "858210397_1065620066534048_8327630126564792895_n.jpg",
        "Palm-shade and yellow sunshine.",
        "Anushka in a yellow embroidered kurta with sunglasses on her head, hoop earrings, and palm trees behind her.",
        "58% 36%",
        False,
        (128, 98),
    ),
    (
        "858670489_1631599788617521_488560758965217568_n.jpg",
        "Stripes and open air.",
        "Anushka in a striped tee and black-and-white floral scarf, outdoors in warm daylight.",
        "61% 32%",
        False,
        (76, 76),
    ),
    (
        "858006166_3377034289163795_6463435477385477721_n.jpg",
        "A little soft, a little sparkle.",
        "Anushka in a navy floral top with a white bow clip, heart and cloud doodles floating across the selfie.",
        "82% 33%",
        False,
        None,
    ),
    (
        "861124822_1828129208499374_6546522378124072103_n.jpg",
        "School-day glow.",
        "Anushka in a blue school shirt and tie, long wavy hair, heart stickers across the frame.",
        "78% 27%",
        False,
        None,
    ),
]

SIZES = (1080, 640)


def to_srgb(im: Image.Image) -> Image.Image:
    """Convert to sRGB when an ICC profile says otherwise; assume sRGB if untagged."""
    icc = im.info.get("icc_profile")
    if not icc:
        return im.convert("RGB")
    src = ImageCms.ImageCmsProfile(icc)
    dst = ImageCms.createProfile("sRGB")
    return ImageCms.profileToProfile(im, src, dst, outputMode="RGB")


def export(im: Image.Image, path: Path, long_edge: int) -> tuple[int, int]:
    w, h = im.size
    scale = long_edge / max(w, h)
    size = (max(1, round(w * scale)), max(1, round(h * scale)))
    out = im.resize(size, Image.Resampling.LANCZOS)
    out.info = {}  # drop source metadata (EXIF/Photoshop blocks)
    out.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    return out.size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("anushka-*.jpg"):
        stale.unlink()

    records = []

    for index, (source, caption, alt, focus, rotate, bars) in enumerate(PHOTOS, start=1):
        src_path = ROOT / source
        if not src_path.exists():
            raise FileNotFoundError(f"missing original: {src_path}")

        im = Image.open(src_path)
        im.load()
        if rotate:
            im = im.rotate(90, expand=True)  # 90 deg counter-clockwise
        if bars:
            top, bottom = bars
            im = im.crop((0, top, im.width, im.height - bottom))
        im = to_srgb(im)

        stem = f"anushka-{index:02d}"
        large = OUT / f"{stem}.jpg"
        small = OUT / f"{stem}-640.jpg"
        width, height = export(im, large, SIZES[0])
        export(im, small, SIZES[1])

        records.append(
            {
                "file": f"assets/photos/{large.name}",
                "small": f"assets/photos/{small.name}",
                "width": width,
                "height": height,
                "alt": alt,
                "caption": caption,
                "focus": focus,
            }
        )
        print(f"{stem}: {source} -> {width}x{height} + 640")

    (OUT / "photos.json").write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote {OUT / 'photos.json'}")


if __name__ == "__main__":
    main()
