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
    # Una per specie di uccello (js/uccelli.js): le varianti cambiano solo colore
    "seagull": "delapouite/seagull",
    "owl": "lorc/owl",
    "raven": "lorc/raven",
    "duck": "delapouite/duck",
    "toucan": "delapouite/toucan",
    "eagle": "lorc/eagle-emblem",
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
