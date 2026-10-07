# One-off asset preparation for the demo site (2026-09-29). Run by hand from a checkout that has the sources beside it
# (the photographer's two Dropbox sets, the label designers' logo PDF, the client's Drive "Bottle Images"); the OUTPUT
# is committed, so a build never needs the sources. When the dashboards' CMS exists these files move into its media
# library and this script retires (the CMS makes renditions at pull time, as margerum-site's media-renditions.mjs does).
#
#   python3 scripts/assets/build_assets.py <sources dir>                  everything
#   python3 scripts/assets/build_assets.py <sources dir> --only V8,H58     those photographs alone, merged into the
#                                                                          committed media.json; the bottles and logo
#                                                                          untouched, so only the needed sources exist
# Either way a photograph media.json holds that PHOTOS no longer names is removed with its files (a replaced photograph
# leaves the site, it is not just unlinked: public/ is deployed whole).
#
# <sources dir> holds: talent.zip ("Day 1 - Round 2", the full batch with talent), vineyard/ (the "Vineyard
# Photography" set), harvest.zip (the 2026 harvest, 88 photos, Remy's Dropbox link of 2026-10-02: "the most recent
# harvest photos"), team/ (doug.png, robert.png, ben.webp, juve.jpg: the portraits on margerumwines.com/our-team/,
# Brooks 2026-10-06: "Add photos of Doug/Ben/Robert. Can pull from Margerum site"), bottles/SAN_*nv_1200.png,
# bottles/Nebbiolo Poured.jpg, SantiRosina-Wordmark-Flower-v2.pdf. Needs Pillow and PyMuPDF.
import hashlib, io, json, os, re, sys, zipfile
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
SRC = sys.argv[1]
ONLY = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
PUB = os.path.join(SITE, 'public')
MEDIA = os.path.join(PUB, 'media')
os.makedirs(os.path.join(MEDIA, 'r'), exist_ok=True)

# the photographs: tag -> alt text. Tags: V<n> = vineyard set "Santi Rosina Vines-<n>.jpg" (V1 = the unnumbered one),
# M<n> = talent set "Santi Rosina-Main-<n>.jpg", H<n> = harvest set "Santi Rosina Harvest-<n>.jpg" (H0 = the
# unnumbered one), NP = the client's "Nebbiolo Poured.jpg", T-<name> = a portrait in team/ (TEAM below). Never Vines-21:
# its block sign names another winery.
# The harvest set holds 11 duplicates, never used: the black-and-white copies of 2, 6, 13, 18, 21, 29, 32 and 84
# (3, 7, 14, 19, 22, 30, 33, 85) and three bursts of one second (44/45, 59/60, 73/74). No frame with a readable
# label either: a bucket's brand (24, 53, 72), a slogan shirt (31), a bin's handwritten block (47), a block sign (16;
# and 86-88, whose posts' tags read "Block 22" at full size).
# Brooks, 2026-10-06: "Cannot have any shot of the home in the photos" — never the house (Vines-2, Vines-24; Our
# Story's banner became Vines-39, the oak over the vines). The garden gate (Vines-50, the Contact banner) and the pizza
# oven (Main-182, the home gallery) were taken out with it the same day and put back on 2026-10-07 (Remy: "These were
# fine actually add back"). "Need a better vineyard shot" (the home page's introduction: Vines-3 → Vines-46),
# "Something more powerful of the vineyard" (Our Story's pond: Vines-16 → Vines-8), "Replace picture" (the stone on a
# post: Vines-13 → Harvest-58, hands at the vine beside "Every vine is tended by hand").
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
    'V46':  'Looking down a row of the vineyard, the vines heavy with fruit, under a wide sky',
    'V8':   'A row of vines running toward the mountains',
    'V39':  'A great oak above the vineyard, the mountains beyond',
    'V20':  'Clusters of red grapes on the vine',
    'V12':  'A cluster of white grapes on the vine',
    'V48':  'Roses in bloom in the garden',
    'V50':  'A garden gate framed by roses',
    'V36':  'Vineyard rows climbing toward the hills',
    'V51':  'The hills of Happy Canyon at golden hour',
    'H4':   'The harvest crew picking by hand at night, under the lights in the rows',
    'H9':   'A picker among the leaves at night, lit by a headlamp',
    'H35':  'Spreading the picked clusters in the bin at first light',
    'H49':  'White grapes, just picked',
    'H58':  'Cutting clusters of white grapes from the vine by hand',
    'H81':  'The vineyard crew beside the vines after the night’s pick',
    'T-doug':   'Doug Margerum, Director of Winemaking',
    'T-robert': 'Robert Daugherty, Head Winemaker',
    'T-ben':    'Ben Merz, Co-Owner of Coastal Vineyard Care Associates',
    'T-juve':   'Juve Buenrostro, Vineyard Manager',
}
# the harvest set's duplicates (the comment above): the second of each pair is never a picture of the site
HARVEST_DUPLICATES = {3, 7, 14, 19, 22, 30, 33, 85, 45, 60, 74}
assert not [t for t in PHOTOS if t[0] == 'H' and int(t[1:]) in HARVEST_DUPLICATES], 'a harvest duplicate chosen'
# never on the site: the house (Brooks, 2026-10-06), another winery's block sign, readable block signs
NEVER = {'V2', 'V24', 'V21', 'H16', 'H86', 'H87', 'H88'}
assert not NEVER & set(PHOTOS), 'a photograph that may never be shown'
# the team's portraits (margerumwines.com/our-team/, 2026-10-06): file in team/, and the x (0-1) of the face's centre,
# so the 4:5 crop the page shows (base.css .person-head img) keeps the face in the middle
TEAM = {'T-doug': ('doug.png', .46), 'T-robert': ('robert.png', .43), 'T-ben': ('ben.webp', .62), 'T-juve': ('juve.jpg', .55)}
MAX = 2000                 # the original's long edge (the <img> fallback and the share image)
WIDTHS = [640, 1280, 2000] # WebP renditions, never wider than the original

_zips = {}
def zipped(name):   # the archive's members by base name, opened the first time a photograph needs it
    if name not in _zips:
        z = zipfile.ZipFile(os.path.join(SRC, name))
        _zips[name] = (z, {os.path.basename(i.filename): i for i in z.infolist()})
    return _zips[name]

def crop45(im, cx):
    # the widest 4:5 window, its centre at cx of the width (kept inside the picture)
    w, h = im.size
    cw = min(w, round(h * 4 / 5)); ch = min(h, round(cw * 5 / 4))
    x = min(max(0, round(cx * w - cw / 2)), w - cw)
    return im.crop((x, (h - ch) // 2, x + cw, (h - ch) // 2 + ch))

def open_photo(tag):
    if tag.startswith('T-'):
        name, cx = TEAM[tag]
        return crop45(ImageOps.exif_transpose(Image.open(os.path.join(SRC, 'team', name))).convert('RGB'), cx)
    if tag == 'NP':
        return Image.open(os.path.join(SRC, 'bottles', 'Nebbiolo Poured.jpg'))
    if tag[0] == 'H':   # 45-61 MP originals: decode at a quarter, then the 2000 px master as for every photo
        n = tag[1:]
        z, names = zipped('harvest.zip')
        im = Image.open(io.BytesIO(z.read(names['Santi Rosina Harvest.jpg' if n == '0' else f'Santi Rosina Harvest-{n}.jpg'])))
        im.draft('RGB', (im.width // 2, im.height // 2))
        return im
    n = tag[1:]
    if tag[0] == 'V':
        name = 'Santi Rosina Vines.jpg' if n == '1' else f'Santi Rosina Vines-{n}.jpg'
        return Image.open(os.path.join(SRC, 'vineyard', name))
    z, names = zipped('talent.zip')
    return Image.open(io.BytesIO(z.read(names[f'Santi Rosina-Main-{n}.jpg'])))

def media_id(key):
    return 'm-' + hashlib.sha256(key.encode()).hexdigest()[:8]

FOCUS = {'V50': 80, 'V39': 62, 'M179': 78, 'M268': 58, 'V51': 60, 'V36': 50, 'M250': 45, 'H4': 62}   # object-position y (%) where a banner crops
MANIFEST = os.path.join(SITE, 'src', 'data', 'media.json')
committed = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {'media': {}, 'bottles': {}}
manifest = {k: v for k, v in committed['media'].items() if ONLY is not None and v['name'] in PHOTOS and v['name'] not in ONLY}
# a photograph PHOTOS no longer names leaves the site: its entry and every file it made
for k, v in committed['media'].items():
    if v['name'] in PHOTOS: continue
    for f in [v['src']] + [u for _, u in v.get('renditions', {}).get('image/webp', [])]:
        if os.path.exists(os.path.join(PUB, f.lstrip('/'))): os.remove(os.path.join(PUB, f.lstrip('/')))
    print('removed', v['name'], k)
assert ONLY is None or ONLY <= set(PHOTOS), f'--only names a photograph PHOTOS does not: {ONLY - set(PHOTOS)}'
for tag, alt in PHOTOS.items():
    if ONLY is not None and tag not in ONLY: continue
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
    if not ladder:   # smaller than the smallest rung (a portrait from a web page): one rendition at its own width
        url = f'/media/r/{mid}-{w}.webp'
        im.save(os.path.join(PUB, url.lstrip('/')), 'WEBP', quality=80, method=6)
        ladder.append([w, url])
    manifest[mid] = {'src': src, 'width': w, 'height': h, 'alt': alt, 'credit': '', 'type': 'image/jpeg',
                     'name': tag, 'renditions': {'image/webp': ladder}}
    if tag.startswith('T-'): manifest[mid]['credit'] = 'margerumwines.com'
    print(tag, mid, w, h)

if ONLY is not None:   # a partial run: the bottles and the logo stay as committed
    for m in manifest.values():
        m.pop('focus', None)
        if m['name'] in FOCUS: m['focus'] = FOCUS[m['name']]
    json.dump({'media': dict(sorted(manifest.items(), key=lambda kv: list(PHOTOS).index(kv[1]['name']))), 'bottles': committed['bottles']},
              open(MANIFEST, 'w'), indent=1)
    print('done:', len(ONLY), 'photos updated,', len(manifest), 'in all')
    sys.exit(0)

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

for m in manifest.values():
    if m['name'] in FOCUS: m['focus'] = FOCUS[m['name']]
json.dump({'media': manifest, 'bottles': bottles}, open(MANIFEST, 'w'), indent=1)
print('done:', len(manifest), 'photos,', len(bottles), 'bottles')
