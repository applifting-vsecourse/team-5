/** Intrinsic-size SVG exports from the current Figma screens. */
export function DesignIcon({ name }: { name: string }) {
  return (
    <img
      src={`/assets/design/${name}.svg`}
      alt=""
      className="shrink-0"
    />
  )
}
