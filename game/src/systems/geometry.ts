import type { DoorDef, Vec } from "../data/types";

// Distance from point p to segment ab. Used to test whether a drawn path skims
// a leak's blocked circle.
export function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

/** True if polyline `path` passes within `radius` of circle center `c`. */
export function pathHitsCircle(path: Vec[], c: Vec, radius: number): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    if (distToSegment(c, path[i], path[i + 1]) <= radius) return true;
  }
  return false;
}

/** True if point `p` lies within `halfWidth` of any segment of polyline `points`. */
export function pointNearPolyline(p: Vec, points: Vec[], halfWidth: number): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment(p, points[i], points[i + 1]) <= halfWidth) return true;
  }
  return false;
}

/**
 * True if point `p` lies inside doorway box `r` (center + size), optionally
 * expanded by `margin` px on every side. Used to test whether an owl was
 * steered into a building entrance.
 */
export function pointInRect(p: Vec, r: DoorDef, margin = 0): boolean {
  const halfW = r.w / 2 + margin;
  const halfH = r.h / 2 + margin;
  return Math.abs(p.x - r.x) <= halfW && Math.abs(p.y - r.y) <= halfH;
}
