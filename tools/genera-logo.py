"""Genera il logo pixel-art: binocolo dorato + ala di pappagallo che spunta."""
import math, sys

W, H = 52, 34
grid = [[None] * W for _ in range(H)]

PAL = {
    "K": "#2a1a08",  # contorno
    "L": "#f6dc7a",  # oro chiaro
    "G": "#d9a521",  # oro
    "D": "#8f5d10",  # oro scuro
    "O": "#16222e",  # vetro
    "o": "#2c4356",  # vetro riflesso
    "W": "#e8f2f7",  # luce
    "R": "#d2352b",  # rosso
    "r": "#8e1f1a",
    "Y": "#f4c430",  # giallo
    "B": "#2f68c4",  # blu
    "b": "#1b3d7a",
}

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        grid[y][x] = c

# --- Ala: penne a ventaglio che spuntano da dietro la lente destra ---
ox, oy = 28, 17
feathers = 7
for i in range(feathers):
    ang = math.radians(5 + i * 12)
    length = 15 + (3 - abs(i - 3)) * 1.6
    alt = i % 2 == 1
    steps = int(length * 4)
    px, py = -math.sin(ang), -math.cos(ang)
    for s in range(steps + 1):
        t = s / steps
        x = ox + math.cos(ang) * t * length
        y = oy - math.sin(ang) * t * length
        if t < 0.5:
            col = "r" if alt else "R"
        elif t < 0.68:
            col = "Y"
        else:
            col = "b" if alt else "B"
        half = 1.4 if t < 0.88 else 0.5
        for k in range(-3, 4):
            w = k / 3 * half
            put(round(x + px * w), round(y + py * w), col)

# --- Binocolo ---
lenses = [(11, 25), (26, 25)]
R_OUT, R_IN = 7.4, 4.6

# ponte centrale e cerniera
for y in range(20, 27):
    for x in range(16, 22):
        put(x, y, "G")
for x in range(17, 21):
    put(x, 19, "D")
    put(x, 18, "G")

# canne superiori (oculari)
for cx, cy in lenses:
    for y in range(cy - 10, cy - 5):
        for x in range(cx - 3, cx + 4):
            put(x, y, "D" if y == cy - 10 else "G")

for cx, cy in lenses:
    for y in range(H):
        for x in range(W):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            if d <= R_IN:
                put(x, y, "O")
            elif d <= R_OUT:
                # luce in alto a sinistra, ombra in basso a destra
                a = (-dx - dy) / (d or 1)
                put(x, y, "L" if a > 0.55 else ("D" if a < -0.45 else "G"))
    # riflessi sul vetro
    put(cx - 2, cy - 2, "W"); put(cx - 1, cy - 2, "W"); put(cx - 2, cy - 1, "W")
    put(cx + 1, cy + 2, "o"); put(cx + 2, cy + 1, "o")

# --- Contorno automatico ---
out = [row[:] for row in grid]
for y in range(H):
    for x in range(W):
        if grid[y][x] is None:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H and grid[ny][nx] not in (None, "K"):
                    out[y][x] = "K"
                    break
grid = out

# --- SVG ---
rects = []
for y in range(H):
    x = 0
    while x < W:
        c = grid[y][x]
        if c is None:
            x += 1
            continue
        run = 1
        while x + run < W and grid[y][x + run] == c:
            run += 1
        rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{PAL[c]}"/>')
        x += run

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'width="{W * 8}" height="{H * 8}" shape-rendering="crispEdges">'
    + "".join(rects) + "</svg>\n"
)
open(sys.argv[1], "w").write(svg)
