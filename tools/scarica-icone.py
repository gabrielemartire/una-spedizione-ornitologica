"""Scarica le icone da game-icons.net (CC BY 3.0) e le salva in js/icons.js.

Il gioco si apre anche da file://, dove il browser non può caricare file esterni:
per questo i tracciati delle icone finiscono direttamente in uno script.

Uso: python3 tools/scarica-icone.py
"""
import json
import pathlib
import re
import urllib.request

# nome nel gioco -> autore/icona su game-icons.net
ICONS = {
    "beech": "lorc/beech",
    "pine": "lorc/pine-tree",
    "rock": "lorc/rock",
    "bush": "delapouite/berry-bush",
    "grass": "delapouite/grass",
    "waves": "lorc/waves",
    "ship": "lorc/galleon",
    "waterfall": "delapouite/waterfall",
    "wall": "delapouite/brick-wall",
    "rubble": "delapouite/stone-pile",
    "ruins": "delapouite/ancient-ruins",
    "bear": "delapouite/bear-head",
    "bird": "delapouite/hummingbird",
    "binoculars": "delapouite/binoculars",
    "house": "delapouite/house",
    "telescope": "delapouite/telescope",
    "pay": "delapouite/receive-money",
    "coins": "delapouite/two-coins",
    "hourglass": "lorc/hourglass",
    "quill": "lorc/quill-ink",
    "sunrise": "delapouite/sunrise",
    "sun": "lorc/sun",
    "moon": "lorc/moon",
    "palm": "delapouite/palm-tree",
    "cactus": "delapouite/cactus",
    "reed": "delapouite/reed",
    "fern": "delapouite/fern",
    "ice": "lorc/frozen-block",
    "deadtree": "lorc/tree-branch",
    "wolf": "lorc/wolf-head",
    "volcano": "delapouite/smoking-volcano",
    "castle": "delapouite/castle",
    "bridge": "delapouite/stone-bridge",
    "flag": "delapouite/flag-objective",
    "drawbridge": "delapouite/drawbridge",
    "check": "delapouite/check-mark",
    "book": "lorc/open-book",
    "backpack": "delapouite/backpack",
    "crate": "delapouite/wooden-crate",
    "tankard": "lorc/beer-stein",
    "scroll": "lorc/scroll-unfurled",
    "boar": "lorc/boar-tusks",
    # Una per specie di uccello (js/uccelli.js): le varianti cambiano solo colore. Provvisorie: arriveranno i disegni
    "sparrow": "lorc/sparrow",
    "owl": "lorc/owl",
    "heron": "caro-asercion/heron",
    "tit": "lorc/bird-twitter",
    "raven": "lorc/raven",
    "seagull": "delapouite/seagull",
    "phoenix": "delapouite/egyptian-bird",
    # Le città: porte delle botteghe, gente, navi, banchina
    "enter": "delapouite/entry-door",
    "person": "delapouite/person",
    "merchant": "lorc/cowled",
    "sailboat": "delapouite/sailboat",
    "fishboat": "delapouite/fishing-boat",
    "pier": "delapouite/wooden-pier",
    "barrel": "delapouite/barrel",
    "anchor": "lorc/anchor",
    "well": "delapouite/well",
    "medicine": "delapouite/medicines",
    "shop": "delapouite/shop",
    "locked": "delapouite/locked-door",
    "bed": "delapouite/person-in-bed",
    "hammer": "lorc/claw-hammer",
    "church": "delapouite/church",
    "compass": "lorc/compass",
    "key": "delapouite/house-keys",
    "egg": "delapouite/raw-egg",
    # Gli oggetti da trovare e vendere
    "sword": "lorc/broadsword",
    "chalice": "lorc/jeweled-chalice",
    "mask": "delapouite/ceremonial-mask",
    "pendant": "lorc/gem-pendant",
    "vase": "delapouite/porcelain-vase",
    "coin": "lorc/crown-coin",
    "map": "lorc/treasure-map",
    "feathers": "lorc/two-feathers",
    "skull": "lorc/animal-skull",
    "lantern": "delapouite/old-lantern",
    "pottery": "delapouite/painted-pottery",
    "statue": "delapouite/colombian-statue",
    "furs": "delapouite/fur-shirt",
    "herbs": "delapouite/fern",
}

BASE = "https://raw.githubusercontent.com/game-icons/icons/master/{}.svg"
ROOT = pathlib.Path(__file__).resolve().parent.parent

paths = {}
for name, source in ICONS.items():
    svg = urllib.request.urlopen(BASE.format(source)).read().decode()
    # Ogni SVG ha un quadrato nero di sfondo e il disegno in bianco: teniamo solo il disegno
    drawn = [d for fill, d in re.findall(r'<path(?: fill="([^"]+)")? d="([^"]+)"', svg) if fill]
    paths[name] = " ".join(drawn)
    print(f"{name:10} <- {source}")

credits = ", ".join(sorted({s.split("/")[0].capitalize() for s in ICONS.values()}))
script = (
    "// Generato da tools/scarica-icone.py: non modificare a mano.\n"
    f"// Icone di game-icons.net ({credits}), licenza CC BY 3.0.\n"
    f"const ICONS = {json.dumps(paths, indent=2)};\n"
)
(ROOT / "js" / "icons.js").write_text(script)
print(f"\nScritte {len(paths)} icone in js/icons.js")
