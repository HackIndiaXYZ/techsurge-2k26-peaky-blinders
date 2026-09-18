import React from "react";

export function AppleStoreIcon({ className = "store-btn__icon", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.61 1.34-.56.64-1.05 1.7-0.92 2.73 1 .08 2-.48 2.61-1.22z" />
    </svg>
  );
}

export function PlayStoreIcon({ className = "store-btn__icon", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.609 1.814L13.793 12 3.61 22.186c-.378-.403-.61-.958-.61-1.579V3.393c0-.621.232-1.176.61-1.579z"
        fill="#00E5FF"
      />
      <path
        d="M17.206 8.587l-3.413 3.413 3.413 3.413 3.904-2.253c1.115-.644 1.115-1.69 0-2.333l-3.904-2.24z"
        fill="#FFC107"
      />
      <path
        d="M3.609 22.186l10.184-10.186 3.413 3.413-11.874 6.852c-.628.363-1.259.278-1.723-.079z"
        fill="#FF3D00"
      />
      <path
        d="M17.206 8.587L5.332 1.735c.464-.357 1.095-.442 1.723-.079l10.151 6.931z"
        fill="#4CAF50"
      />
    </svg>
  );
}

interface StoreButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "dark" | "light" | "outlined";
}

export function AppStoreButton({
  href = "#download",
  className = "",
  variant = "light",
  ...props
}: StoreButtonProps) {
  return (
    <a
      href={href}
      className={`store-btn store-btn--appstore store-btn--${variant} ${className}`}
      aria-label="Download on the Apple App Store"
      {...props}
    >
      <AppleStoreIcon />
      <span className="store-btn__text">
        <span className="store-btn__kicker">Download on the</span>
        <span className="store-btn__title">App Store</span>
      </span>
    </a>
  );
}

export function PlayStoreButton({
  href = "#download",
  className = "",
  variant = "light",
  ...props
}: StoreButtonProps) {
  return (
    <a
      href={href}
      className={`store-btn store-btn--playstore store-btn--${variant} ${className}`}
      aria-label="Get it on Google Play"
      {...props}
    >
      <PlayStoreIcon />
      <span className="store-btn__text">
        <span className="store-btn__kicker">GET IT ON</span>
        <span className="store-btn__title">Google Play</span>
      </span>
    </a>
  );
}
