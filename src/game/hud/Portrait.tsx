/**
 * Tyler's head and shoulders, flat, for the trainer badge and profile: black
 * hair parted in the middle, a black tee under the Team Mystic jacket.
 */
export function Portrait({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="5 0 30 30" width={size} height={size} aria-hidden>
      <path d="M12.5 22.6C13 19.7 16 18.5 20 18.5s7 1.2 7.5 4.1Z" fill="#0a6fb3" />
      <path d="M7 30c0-6 5-9.8 13-9.8S33 24 33 30Z" fill="#0b84d6" />
      <path d="M17.3 20.5Q20 22.7 22.7 20.5L22.4 30H17.6Z" fill="#1e2227" />
      <rect x="17.6" y="17.6" width="4.8" height="3.4" rx="1" fill="#e6b994" />
      <ellipse cx="12.8" cy="13.2" rx="1.5" ry="2.1" fill="#ecc19e" />
      <ellipse cx="27.2" cy="13.2" rx="1.5" ry="2.1" fill="#ecc19e" />
      <ellipse cx="20" cy="12.2" rx="7.3" ry="7.9" fill="#f2cfb0" />
      <ellipse cx="15.7" cy="15.7" rx="1.3" ry="0.8" fill="#f0a88f" opacity=".35" />
      <ellipse cx="24.3" cy="15.7" rx="1.3" ry="0.8" fill="#f0a88f" opacity=".35" />
      <path
        d="M12.1 14.6C10.9 9.8 11.9 4.4 16.4 2.4 18 1.7 19.4 1.9 20 2.8 20.6 1.9 22 1.7 23.6 2.4 28.1 4.4 29.1 9.8 27.9 14.6 27.4 12.4 26.8 11 25.6 10.3 24.2 9.6 23 9.9 22 10.2 21.2 8.6 20.6 6.8 20 5.2 19.4 6.8 18.8 8.6 18 10.2 17 9.9 15.8 9.6 14.4 10.3 13.2 11 12.6 12.4 12.1 14.6Z"
        fill="#1c1818"
      />
      <path d="M15.3 11.2h2.9M21.8 11.2h2.9" stroke="#1c1818" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="17" cy="13" rx="1.15" ry="0.95" fill="#1c1818" />
      <ellipse cx="23" cy="13" rx="1.15" ry="0.95" fill="#1c1818" />
      <circle cx="17.4" cy="12.7" r="0.32" fill="#fff" />
      <circle cx="23.4" cy="12.7" r="0.32" fill="#fff" />
      <ellipse cx="20" cy="15" rx="0.9" ry="0.55" fill="#e0ab89" />
      <path d="M17.9 17q2.1 1.3 4.2 0" stroke="#b5705a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
