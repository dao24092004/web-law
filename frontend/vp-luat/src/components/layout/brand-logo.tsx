import Image from 'next/image';
import Link from 'next/link';

export type BrandLogoVariant = 'header' | 'footer' | 'sidebar';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  href?: string;
  /** Show text block next to image */
  showText?: boolean;
  /** Sub line below brand name (e.g. "Law Firm", "Admin", "Staff") */
  subline?: string;
  className?: string;
};

const LOGO_SRC = '/logolaw-removebg-preview.png';

const DIMENSIONS: Record<
  BrandLogoVariant,
  { width: number; height: number }
> = {
  header: { width: 48, height: 48 },
  footer: { width: 64, height: 64 },
  sidebar: { width: 44, height: 44 },
};

export function BrandLogo({
  variant = 'header',
  href = '/',
  showText = true,
  subline = '',
  className = '',
}: BrandLogoProps) {
  const { width, height } = DIMENSIONS[variant];

  const image = (
    <Image
      src={LOGO_SRC}
      alt="ICRC Law"
      width={width}
      height={height}
      priority
      className="brand-logo__img"
    />
  );

  if (!showText) {
    return href ? (
      <Link
        href={href}
        className={`brand-logo brand-logo--${variant} ${className}`.trim()}
        aria-label="ICRC Law"
      >
        {image}
      </Link>
    ) : (
      <span className={`brand-logo brand-logo--${variant} ${className}`.trim()}>{image}</span>
    );
  }

  const text = (
    <span className="brand-logo__text">
      <span className="brand-logo__name">ICRC Law</span>
      {subline ? <span className="brand-logo__sub">{subline}</span> : null}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`brand-logo brand-logo--${variant} ${className}`.trim()}
        aria-label="ICRC Law"
      >
        {image}
        {text}
      </Link>
    );
  }

  return (
    <span className={`brand-logo brand-logo--${variant} ${className}`.trim()}>
      {image}
      {text}
    </span>
  );
}
