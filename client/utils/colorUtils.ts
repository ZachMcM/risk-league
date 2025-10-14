export const lightenColor = (hex: string, percent: number) => {
  const num = parseInt(hex, 16);
  const r = Math.min(
    255,
    (num >> 16) + Math.round((255 - (num >> 16)) * percent)
  );
  const g = Math.min(
    255,
    ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * percent)
  );
  const b = Math.min(
    255,
    (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * percent)
  );
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};
