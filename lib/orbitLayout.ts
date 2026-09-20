export type OrbitPosition = {
  index: number;
  ring: number;
  /** Offset from graph center (px). */
  x: number;
  y: number;
};

export type OrbitLayout = {
  positions: OrbitPosition[];
  /** Half-extent from center to farthest node edge + padding. */
  radius: number;
  ringCount: number;
};

export type OrbitLayoutOptions = {
  nodeSize?: number;
  centerSize?: number;
  gap?: number;
  padding?: number;
};

/**
 * Place `n` nodes on concentric rings around a center hub.
 * Each ring fills to capacity (based on circumference / node pitch)
 * before spilling to the next outer ring.
 */
export function layoutConcentricOrbit(
  n: number,
  options: OrbitLayoutOptions = {},
): OrbitLayout {
  const nodeSize = options.nodeSize ?? 96;
  const centerSize = options.centerSize ?? 168;
  const gap = options.gap ?? 28;
  const padding = options.padding ?? 24;

  if (n <= 0) {
    return {
      positions: [],
      radius: centerSize / 2 + padding,
      ringCount: 0,
    };
  }

  const pitch = nodeSize + gap;
  const positions: OrbitPosition[] = [];
  let remaining = n;
  let ring = 0;
  let maxRadius = 0;

  while (remaining > 0) {
    const ringRadius =
      centerSize / 2 + nodeSize / 2 + gap + ring * pitch;
    const capacity = Math.max(
      1,
      Math.floor((2 * Math.PI * ringRadius) / pitch),
    );
    const countOnRing = Math.min(remaining, capacity);
    // Stagger each ring so nodes don't align radially.
    const angleOffset = ring * ((2 * Math.PI) / Math.max(capacity, 1) / 2);

    for (let i = 0; i < countOnRing; i++) {
      const angle = angleOffset + (2 * Math.PI * i) / countOnRing;
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;
      positions.push({
        index: positions.length,
        ring,
        x,
        y,
      });
    }

    maxRadius = ringRadius;
    remaining -= countOnRing;
    ring += 1;
  }

  return {
    positions,
    radius: maxRadius + nodeSize / 2 + padding,
    ringCount: ring,
  };
}
