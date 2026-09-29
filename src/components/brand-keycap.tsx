// Brand keycaps: a bone cap with a hanger legend (the fitting room, 试衣间,
// for keycaps) and a graphite cap with the Overwrite Studio mark, like a
// maker's novelty key. public/favicon.svg draws the hanger cap.
export function BrandKeycap() {
  const cap = "keycap grid size-9 place-items-center [--cap-depth:4px] [--cap-radius:8px]"
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={`${cap} keycap-bone`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M10 6.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.8-.8 1.3v.9" />
          <path d="M12 10.5 3.5 16.6a.8.8 0 0 0 .5 1.4h16a.8.8 0 0 0 .5-1.4z" />
        </svg>
      </span>
      <span role="img" aria-label="Overwrite Studio" title="Overwrite Studio" className={`${cap} keycap-graphite`}>
        {/* Traced from the studio's logo: a ring around an angular S. */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
          <circle cx="12" cy="12" r="10" />
          <path d="M11.1 2 6.1 12h11.8l-5 10M8.6 7h12.06M3.34 17H15.4" />
        </svg>
      </span>
    </span>
  )
}
