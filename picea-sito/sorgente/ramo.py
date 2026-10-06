"""Genera il rametto di Picea abies (abete rosso) usato come motivo grafico del sito."""
import math


def _rot(vx, vy, gradi):
    a = math.radians(gradi)
    return vx * math.cos(a) - vy * math.sin(a), vx * math.sin(a) + vy * math.cos(a)


def ramo_svg(classe="ramo"):
    p0, p1, p2 = (14, 196), (170, 150), (404, 36)

    def punto(t):
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        n = math.hypot(dx, dy)
        return x, y, dx / n, dy / n

    d = [f"M{p0[0]} {p0[1]}Q{p1[0]} {p1[1]} {p2[0]} {p2[1]}"]
    n = 62
    for i in range(2, n):
        t = i / n
        x, y, tx, ty = punto(t)
        lung = (26 - 19 * t) * (0.86 + 0.14 * ((i * 7) % 5) / 4)
        for ang in (48 + (i % 3) * 4, -(46 + (i % 4) * 3)):
            vx, vy = _rot(tx, ty, ang)
            d.append(f"M{x:.1f} {y:.1f}l{vx * lung:.1f} {vy * lung:.1f}")
    for t0, lato, ls in ((0.30, -1, 112), (0.57, 1, 84)):
        x, y, tx, ty = punto(t0)
        vx, vy = _rot(tx, ty, 36 * lato)
        d.append(f"M{x:.1f} {y:.1f}l{vx * ls:.1f} {vy * ls:.1f}")
        for j in range(2, 18):
            u = j / 18
            px, py = x + vx * ls * u, y + vy * ls * u
            lung = 16 - 10 * u
            for ang in (46, -46):
                wx, wy = _rot(vx, vy, ang)
                d.append(f"M{px:.1f} {py:.1f}l{wx * lung:.1f} {wy * lung:.1f}")
    return (f'<svg class="{classe}" viewBox="0 0 420 220" aria-hidden="true" focusable="false">'
            f'<path d="{"".join(d)}" fill="none" stroke="currentColor" stroke-width="1.35" '
            f'stroke-linecap="round"/></svg>')
