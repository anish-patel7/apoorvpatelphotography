import { useId } from 'react';
import {
  LAYOUT as L, POSTER_BRAND, POSTER_COLORS as C, POSTER_FONTS as F, POSTER_HANDLE, POSTER_HEIGHT as H, POSTER_TAGLINE, POSTER_WIDTH as W,
} from '../../utils/reelPoster';

interface BrandedReelPosterProps {
  title?: string;
  label?: string;
  className?: string;
}

/**
 * Live branded poster shown wherever a reel has no cover image (or its image fails to load),
 * so a card is never blank. Same layout as the JPEG saved by "Generate Missing Thumbnails".
 */
export default function BrandedReelPoster({ title, label = 'REEL', className = '' }: BrandedReelPosterProps) {
  const id = useId().replace(/:/g, '');
  const cy = L.emblemY;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full ${className}`}
      role="img"
      aria-label={`${title || 'Reel'} — Apoorv Patel Photography`}
      data-branded-poster="true"
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.backgroundTop} />
          <stop offset="1" stopColor={C.backgroundBottom} />
        </linearGradient>
        <radialGradient id={`gl${id}`} gradientUnits="userSpaceOnUse" cx={W / 2} cy={L.emblemY} r={W * 0.75}>
          <stop offset="0" stopColor={C.glow} />
          <stop offset="1" stopColor="rgba(255,183,122,0)" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#bg${id})`} />
      <rect width={W} height={H} fill={`url(#gl${id})`} />
      <rect x="54" y="54" width={W - 108} height={H - 108} fill="none" stroke={C.goldSoft} strokeWidth="3" />
      <text x={W / 2} y={L.brandY} textAnchor="middle" dominantBaseline="middle" fill={C.text} fontFamily={F.body} fontWeight="600" fontSize="32" letterSpacing="7">{POSTER_BRAND}</text>
      <rect x={W / 2 - 60} y={L.dividerY} width="120" height="3" fill={C.gold} />
      <text x={W / 2} y={L.labelY} textAnchor="middle" dominantBaseline="middle" fill={C.gold} fontFamily={F.body} fontWeight="600" fontSize="30" letterSpacing="12">{label}</text>
      <circle cx={W / 2} cy={cy} r={L.ringR} fill="none" stroke={C.gold} strokeWidth="6" />
      <path d={`M${W / 2 - 34} ${cy - 56} L${W / 2 - 34} ${cy + 56} L${W / 2 + 62} ${cy} Z`} fill={C.gold} />
      <text x={W / 2} y={L.taglineY} textAnchor="middle" dominantBaseline="middle" fill={C.textMuted} fontFamily={F.display} fontStyle="italic" fontWeight="500" fontSize="44">{POSTER_TAGLINE}</text>
      <text x={W / 2} y={L.handleY} textAnchor="middle" dominantBaseline="middle" fill={C.textMuted} fontFamily={F.body} fontSize="30">{POSTER_HANDLE}</text>
    </svg>
  );
}
