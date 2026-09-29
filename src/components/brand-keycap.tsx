// Brand keycap with a hanger legend: the fitting room (试衣间) for keycaps.
// public/favicon.svg draws the same cap.
export function BrandKeycap() {
  return (
    <span aria-hidden className="keycap keycap-bone grid size-9 place-items-center [--cap-depth:4px] [--cap-radius:8px]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M10 6.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.8-.8 1.3v.9" />
        <path d="M12 10.5 3.5 16.6a.8.8 0 0 0 .5 1.4h16a.8.8 0 0 0 .5-1.4z" />
      </svg>
    </span>
  )
}
