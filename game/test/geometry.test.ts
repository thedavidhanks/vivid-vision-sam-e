import { describe, expect, it } from "vitest";
import { pointInRect, pathHitsCircle, pointNearPolyline } from "../src/systems/geometry";
import type { DoorDef } from "../src/data/types";

describe("pointInRect", () => {
  // A doorway box centered at (100, 100), 40 wide x 20 tall.
  const door: DoorDef = { x: 100, y: 100, w: 40, h: 20 };

  it("is true at the center", () => {
    expect(pointInRect({ x: 100, y: 100 }, door)).toBe(true);
  });

  it("is true just inside each edge", () => {
    expect(pointInRect({ x: 119, y: 100 }, door)).toBe(true); // right (half-w = 20)
    expect(pointInRect({ x: 100, y: 91 }, door)).toBe(true); // top (half-h = 10)
  });

  it("is true exactly on the edge", () => {
    expect(pointInRect({ x: 120, y: 100 }, door)).toBe(true);
    expect(pointInRect({ x: 100, y: 110 }, door)).toBe(true);
  });

  it("is false outside the box", () => {
    expect(pointInRect({ x: 121, y: 100 }, door)).toBe(false);
    expect(pointInRect({ x: 100, y: 111 }, door)).toBe(false);
    expect(pointInRect({ x: 200, y: 200 }, door)).toBe(false);
  });

  it("counts points within the margin as inside", () => {
    // 15px past the right edge is outside the box but inside a 20px margin.
    expect(pointInRect({ x: 135, y: 100 }, door)).toBe(false);
    expect(pointInRect({ x: 135, y: 100 }, door, 20)).toBe(true);
    // Still outside once past box half-extent + margin (20 + 20 = 40).
    expect(pointInRect({ x: 141, y: 100 }, door, 20)).toBe(false);
  });
});

describe("pathHitsCircle", () => {
  const center = { x: 50, y: 50 };
  const radius = 10;

  it("is true when a segment passes through the circle", () => {
    const path = [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ];
    expect(pathHitsCircle(path, center, radius)).toBe(true);
  });

  it("is false when the path stays clear of the circle", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    expect(pathHitsCircle(path, center, radius)).toBe(false);
  });
});

describe("pointNearPolyline", () => {
  // An L-shaped walk: (0,0)->(100,0)->(100,100).
  const line = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];

  it("is true right on the centerline", () => {
    expect(pointNearPolyline({ x: 50, y: 0 }, line, 5)).toBe(true);
    expect(pointNearPolyline({ x: 100, y: 60 }, line, 5)).toBe(true);
  });

  it("is true within halfWidth of a segment", () => {
    expect(pointNearPolyline({ x: 50, y: 4 }, line, 5)).toBe(true);
  });

  it("is false beyond halfWidth", () => {
    expect(pointNearPolyline({ x: 50, y: 12 }, line, 5)).toBe(false);
    expect(pointNearPolyline({ x: 200, y: 200 }, line, 5)).toBe(false);
  });

  it("is true near the corner shared by two segments", () => {
    expect(pointNearPolyline({ x: 100, y: 0 }, line, 5)).toBe(true);
  });
});
