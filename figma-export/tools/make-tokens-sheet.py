"""Generates figma-export/00-design-tokens.svg from src/styles/tokens.css.

    python3 figma-export/tools/make-tokens-sheet.py
"""
import html
import re

css = open('src/styles/tokens.css').read()
colors = re.findall(r'--(color-[a-z-]+):\s*(#[0-9a-fA-F]{6})', css)
space = re.findall(r'--(space-\d):\s*([\d.]+)rem', css)
radius = re.findall(r'--(radius-[a-z]+):\s*(\d+)px', css)

W = 1280
out = []


def t(x, y, s, size=14, weight=400, fill='#2b2420', family='Inter', anchor=None):
    a = f' text-anchor="{anchor}"' if anchor else ''
    out.append(
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
        f'fill="{fill}"{a} xml:space="preserve">{html.escape(s)}</text>'
    )


t(48, 72, 'Restaurant Journal: design tokens', 36, 700, family='Fraunces')
t(48, 100, 'Generated from src/styles/tokens.css. Fonts: Fraunces (headings) and Inter (body), both on Google Fonts.', 14, 400, '#6b5d52')

# colors
t(48, 152, 'Colors', 22, 700, family='Fraunces')
x0, y0, cw, ch, gap, pitch = 48, 172, 180, 96, 16, 150
for i, (name, hexv) in enumerate(colors):
    col, row = i % 6, i // 6
    x = x0 + col * (cw + gap)
    y = y0 + row * pitch
    out.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" rx="14" fill="{hexv}" stroke="#e3d7c6"/>')
    t(x, y + ch + 20, name.replace('color-', ''), 13, 600)
    t(x, y + ch + 37, hexv.upper(), 12, 400, '#6b5d52')
rows = (len(colors) + 5) // 6
y = y0 + rows * pitch + 20

# typography
t(48, y, 'Typography', 22, 700, family='Fraunces')
y += 48
samples = [
    ('Heading 1 · Fraunces Bold 28', 28, 700, 'Fraunces', 'Discover'),
    ('Heading 2 · Fraunces Bold 21', 21, 700, 'Fraunces', 'New & notable'),
    ('Heading 3 · Fraunces Bold 18', 18, 700, 'Fraunces', 'Basil & Brine'),
    ('Body · Inter Regular 16', 16, 400, 'Inter', 'Northern Thai grill smoke and house-fermented chili pastes.'),
    ('Small · Inter Medium 14', 14, 500, 'Inter', 'Thai · Capitol Hill · $$'),
    ('Label · Inter SemiBold 12', 12, 600, 'Inter', 'NEIGHBORHOOD'),
]
for label, size, weight, fam, sample in samples:
    t(48, y, sample, size, weight, family=fam)
    t(640, y, label, 12, 400, '#6b5d52')
    y += size + 22
y += 16

# spacing + radii
t(48, y, 'Spacing', 22, 700, family='Fraunces')
t(640, y, 'Radius', 22, 700, family='Fraunces')
y += 30
sy = y
for name, rem in space:
    px = float(rem) * 16
    out.append(f'<rect x="48" y="{sy}" width="{px}" height="18" rx="3" fill="#b4472b"/>')
    t(48 + px + 14, sy + 14, f'{name} · {int(px)}px', 13, 500)
    sy += 28
ry, rx = y, 640
for name, px in radius:
    r = min(int(px), 32)
    out.append(f'<rect x="{rx}" y="{ry}" width="64" height="64" rx="{r}" fill="#ffffff" stroke="#857667" stroke-width="1.5"/>')
    t(rx + 76, ry + 28, name.replace('radius-', ''), 13, 600)
    t(rx + 76, ry + 46, f'{px}px', 12, 400, '#6b5d52')
    rx += 190
    if rx > 1100:
        rx = 640
        ry += 84
y = max(sy, ry + 84) + 24

# elevation + touch target
t(48, y, 'Elevation & touch', 22, 700, family='Fraunces')
y += 24


def shadow(fid, dy, blur, alpha):
    return (
        f'<filter id="{fid}" x="0" y="0" width="{W}" height="2000" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
        '<feFlood flood-opacity="0" result="BackgroundImageFix"/>'
        '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>'
        f'<feOffset dy="{dy}"/><feGaussianBlur stdDeviation="{blur}"/><feComposite in2="hardAlpha" operator="out"/>'
        f'<feColorMatrix type="matrix" values="0 0 0 0 0.169 0 0 0 0 0.141 0 0 0 0 0.125 0 0 0 {alpha} 0"/>'
        '<feBlend mode="normal" in2="BackgroundImageFix" result="e1"/><feBlend mode="normal" in="SourceGraphic" in2="e1" result="shape"/></filter>'
    )


out.append(f'<defs>{shadow("s1", 4, 7, 0.06)}{shadow("s2", 6, 10, 0.25)}</defs>')
out.append(f'<rect x="48" y="{y + 8}" width="220" height="90" rx="14" fill="#ffffff" filter="url(#s1)"/>')
t(64, y + 58, 'Card shadow', 14, 600)
out.append(f'<rect x="300" y="{y + 8}" width="220" height="90" rx="14" fill="#b4472b" filter="url(#s2)"/>')
t(316, y + 58, 'Floating button shadow', 14, 600, '#ffffff')
out.append(f'<rect x="560" y="{y + 8}" width="148" height="44" rx="22" fill="#b4472b"/>')
t(634, y + 36, '44px tap target', 13, 600, '#ffffff', anchor='middle')
total = y + 130

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{total}" viewBox="0 0 {W} {total}" fill="none">'
    f'<rect width="{W}" height="{total}" fill="#faf5ee"/>' + ''.join(out) + '</svg>'
)
open('figma-export/00-design-tokens.svg', 'w').write(svg)
print(f'{len(colors)} colors, {len(space)} spacing, {len(radius)} radii, height {total}')
