# One-off asset preparation for the demo site (2026-09-29). Run by hand from a checkout that has the sources beside it
# (the photographer's two Dropbox sets, the label designers' logo PDF, the client's Drive "Bottle Images"); the OUTPUT
# is committed, so a build never needs the sources. When the dashboards' CMS exists these files move into its media
# library and this script retires (the CMS makes renditions at pull time, as margerum-site's media-renditions.mjs does).
#
#   python3 scripts/assets/build_assets.py <sources dir>
#
# <sources dir> holds: talent.zip ("Day 1 - Round 2", the full batch with talent), vineyard/ (the "Vineyard
# Photography" set), bottles/SAN_*nv_1200.png, bottles/Nebbiolo Poured.jpg, SantiRosina-Wordmark-Flower-v2.pdf.
# Needs Pillow and PyMuPDF.
import hashlib, io, json, os, re, sys, zipfile
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
PUB = os.path.join(SITE, 'public')
MEDIA = os.path.join(PUB, 'media')
os.makedirs(os.path.join(MEDIA, 'r'), exist_ok=True)

# the photographs: tag -> alt text. Tags: V<n> = vineyard set "Santi Rosina Vines-<n>.jpg" (V1 = the unnumbered one),
# M<n> = talent set "Santi Rosina-Main-<n>.jpg", NP = the client's "Nebbiolo Poured.jpg". Never Vines-21: its block
# sign names another winery.
PHOTOS = {
    'M268': 'A long dinner table in the estate garden among roses and lavender, the hills of Happy Canyon beyond',
    'M179': 'Dinner at a long table in the garden, among roses and lavender',
    'M250': 'Friends raising glasses of red wine at dinner in the garden',
    'M243': 'Glasses raised along a table in the garden',
    'M222': 'Red wine poured for a guest at the table',
    'M161': 'Santi Rosina Nebbiolo on a garden table with bread, olives and flowers',
    'M182': 'A pizza going into the wood-fired oven',
    'M140': 'Pizzas fresh from the oven',
    'M152': 'A long table set for dinner on the lawn',
    'M155': 'Place settings with sprigs of lavender along a long table',
    'NP':   'Nebbiolo poured into a glass',
    'V3':   'Vineyard rows beneath the rolling hills of Happy Canyon',
    'V24':  'The estate house above the vineyard, mountains beyond',
    'V16':  'A pond among the oaks and hills of the estate',
    'V20':  'Clusters of red grapes on the vine',
    'V12':  'A cluster of white grapes on the vine',
    'V48':  'Roses in bloom in the garden',
    'V13':  'A stone resting on a vineyard post among the vines',
    'V50':  'A garden gate framed by roses',
    'V36':  'Vineyard rows climbing toward the hills',
    'V51':  'The hills of Happy Canyon at golden hour',
}
MAX = 2000                 # the original's long edge (the <img> fallback and the share image)
WIDTHS = [640, 1280, 2000] # WebP renditions, never wider than the original

talent = zipfile.ZipFile(os.path.join(SRC, 'talent.zip'))
talent_names = {os.path.basename(i.filename): i for i in talent.infolist()}

def open_photo(tag):
    if tag == 'NP':
        return Image.open(os.path.join(SRC, 'bottles', 'Nebbiolo Poured.jpg'))
    n = tag[1:]
    if tag[0] == 'V':
        name = 'Santi Rosina Vines.jpg' if n == '1' else f'Santi Rosina Vines-{n}.jpg'
        return Image.open(os.path.join(SRC, 'vineyard', name))
    return Image.open(io.BytesIO(talent.read(talent_names[f'Santi Rosina-Main-{n}.jpg'])))

def media_id(key):
    return 'm-' + hashlib.sha256(key.encode()).hexdigest()[:8]

manifest = {}
for tag, alt in PHOTOS.items():
    mid = media_id('photo:' + tag)
    im = ImageOps.exif_transpose(open_photo(tag)).convert('RGB')
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    w, h = im.size
    src = f'/media/{mid}.jpg'
    im.save(os.path.join(PUB, src.lstrip('/')), 'JPEG', quality=80, optimize=True, progressive=True)
    ladder = []
    for rw in WIDTHS:
        if rw > w: continue
        r = im if rw == w else im.resize((rw, round(h * rw / w)), Image.LANCZOS)
        url = f'/media/r/{mid}-{rw}.webp'
        r.save(os.path.join(PUB, url.lstrip('/')), 'WEBP', quality=74, method=6)
        ladder.append([rw, url])
    manifest[mid] = {'src': src, 'width': w, 'height': h, 'alt': alt, 'credit': '', 'type': 'image/jpeg',
                     'name': tag, 'renditions': {'image/webp': ladder}}
    print(tag, mid, w, h)

# ---- the bottle shots: the client's "Bottle Images" (1200 px tall, transparent, front label, no vintage on it), one per
# wine, set on ONE canvas so every card's bottle stands at the same height and centre ----
BOTTLES = {'sauvignon-blanc': 'SAN_SauvBlanc24nv_1200.png', 'sangiovese': 'SAN_Sangio21nv_1200.png',
           'nebbiolo': 'SAN_Nebbio21nv_1200.png', 'cabernet-sauvignon': 'SAN_Cab18nv_1200.png'}
os.makedirs(os.path.join(PUB, 'art', 'bottles'), exist_ok=True)
CW, CH = 400, 1240          # canvas: the widest bottle (~320) + air, the tallest (~1190) + air
bottles = {}
for key, name in BOTTLES.items():
    b = Image.open(os.path.join(SRC, 'bottles', name)).convert('RGBA')
    b = b.crop(b.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    scale = min((CW - 40) / b.width, (CH - 30) / b.height)
    if scale < 1: b = b.resize((round(b.width * scale), round(b.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    canvas.paste(b, ((CW - b.width) // 2, CH - 12 - b.height), b)
    out = {}
    for hh in (1240, 620):
        c = canvas if hh == CH else canvas.resize((round(CW * hh / CH), hh), Image.LANCZOS)
        p = f'/art/bottles/{key}-{hh}.webp'
        c.save(os.path.join(PUB, p.lstrip('/')), 'WEBP', quality=86, method=6)
        out[hh] = p
    png = f'/art/bottles/{key}.png'
    canvas.resize((CW // 2, CH // 2), Image.LANCZOS).save(os.path.join(PUB, png.lstrip('/')), 'PNG', optimize=True)
    bottles[key] = {'png': png, 'webp': out, 'width': CW, 'height': CH}
    print('bottle', key, b.size)

# ---- the logo: the label designers' wordmark (vector, Bembo, ink #231F20) and their watercolour rose ----
import pymupdf
pdf = pymupdf.open(os.path.join(SRC, 'SantiRosina-Wordmark-Flower-v2.pdf'))
def fmt(v): return ('%.2f' % v).rstrip('0').rstrip('.')
def path_of(dr, ox, oy):
    out, last = [], None
    for it in dr['items']:
        op = it[0]
        if op == 'l':
            p1, p2 = it[1], it[2]
            if last is None or abs(p1.x - last.x) > .01 or abs(p1.y - last.y) > .01: out.append(f'M{fmt(p1.x-ox)} {fmt(p1.y-oy)}')
            out.append(f'L{fmt(p2.x-ox)} {fmt(p2.y-oy)}'); last = p2
        elif op == 'c':
            p1, c1, c2, p2 = it[1:5]
            if last is None or abs(p1.x - last.x) > .01 or abs(p1.y - last.y) > .01: out.append(f'M{fmt(p1.x-ox)} {fmt(p1.y-oy)}')
            out.append(f'C{fmt(c1.x-ox)} {fmt(c1.y-oy)} {fmt(c2.x-ox)} {fmt(c2.y-oy)} {fmt(p2.x-ox)} {fmt(p2.y-oy)}'); last = p2
        elif op == 're':
            r = it[1]; out.append(f'M{fmt(r.x0-ox)} {fmt(r.y0-oy)}H{fmt(r.x1-ox)}V{fmt(r.y1-oy)}H{fmt(r.x0-ox)}Z'); last = None
    return ''.join(out) + 'Z'
marks = {}
for layout, pno in (('line', 0), ('stacked', 3)):
    page = pdf[pno]
    drs = page.get_drawings()
    u = drs[0]['rect']
    for x in drs[1:]: u |= x['rect']
    rose = page.get_image_rects(15)[0]
    d = ''.join(path_of(x, u.x0, u.y0) for x in drs)
    marks[layout] = {'w': round(u.width, 2), 'h': round(u.height, 2), 'd': d,
                     # the rose's box in the same units, relative to the wordmark's top-left (the 2026 logo: stacked, rose beneath)
                     'rose': [round(rose.x0 - u.x0, 2), round(rose.y0 - u.y0, 2), round(rose.width, 2), round(rose.height, 2)]}
# the rose: a CMYK watercolour on WHITE in the PDF (its soft mask is solid), so the white becomes transparency
# ("colour to alpha" against white): alpha = 1 - min(r,g,b)/255, colour un-multiplied — over a light ground it looks
# exactly as printed
base = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.Pixmap(pdf, 15))
rose_rgb = Image.frombytes('RGB', (base.width, base.height), base.samples)
px = rose_rgb.load()
rose = Image.new('RGBA', rose_rgb.size)
rp = rose.load()
for y in range(rose_rgb.height):
    for x in range(rose_rgb.width):
        r, g, b = px[x, y]
        m = min(r, g, b)
        a = 0 if m >= 246 else (255 - m) / 255
        if a <= 0: rp[x, y] = (0, 0, 0, 0); continue
        un = lambda c: max(0, min(255, round((c - 255 * (1 - a)) / a)))
        rp[x, y] = (un(r), un(g), un(b), round(a * 255))
os.makedirs(os.path.join(PUB, 'brand'), exist_ok=True)
rose.save(os.path.join(PUB, 'brand', 'rose.png'), 'PNG', optimize=True)
rose.save(os.path.join(PUB, 'brand', 'rose.webp'), 'WEBP', quality=90, method=6)
marks['roseImage'] = {'w': rose.width, 'h': rose.height}
json.dump(marks, open(os.path.join(SITE, 'src', 'components', 'brand', 'marks.json'), 'w'))

FOCUS = {'V50': 80, 'V24': 72, 'M179': 78, 'M268': 58, 'V51': 60, 'V36': 50, 'M250': 45}   # object-position y (%) where a banner crops
for m in manifest.values():
    if m['name'] in FOCUS: m['focus'] = FOCUS[m['name']]
json.dump({'media': manifest, 'bottles': bottles}, open(os.path.join(SITE, 'src', 'data', 'media.json'), 'w'), indent=1)
print('done:', len(manifest), 'photos,', len(bottles), 'bottles')
