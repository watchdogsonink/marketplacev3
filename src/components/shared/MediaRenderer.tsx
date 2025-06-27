import React from "react";

interface MediaRendererProps {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
}

const defaultImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAwIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4yIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxzdHlsZT5yZWN0e3dpZHRoOjFweDtoZWlnaHQ6MXB4fTwvc3R5bGU+PGcgc3R5bGU9InRyYW5zZm9ybTogdHJhbnNsYXRlKGNhbGMoNTAlIC0gMTJweCksIGNhbGMoNTAlIC0gMTJweCkpIj48cmVjdCB4PSIxNCIgeT0iMiIgZmlsbD0iIzAwMDAwMGZmIi8+PC9nPjwvc3ZnPg==";

export const MediaRenderer: React.FC<MediaRendererProps> = ({ src, alt = "media", style }) => {
  const imageUrl = src && src.length > 0 ? src : defaultImage;
  return <img src={imageUrl} alt={alt} style={style} />;
};