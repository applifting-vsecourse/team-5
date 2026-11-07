type IconName =
  | "ChevL"
  | "Eye"
  | "Eye1"
  | "Grip"
  | "Clock"
  | "Target"
  | "PreviewTarget"
  | "PreviewCheck"
  | "Corner"
  | "Plus"
  | "Book"
  | "Edit"
  | "Pause"
  | "Cal"
  | "Search"
  | "Check"
  | "Whistle"
  | "LibraryUsers"
  | "LibraryTarget"
  | "Zap"
  | "Paw"
  | "Plus1"
  | "X"
  | "More"

// Original Figma exports retain their intrinsic dimensions and colours.
export function EditorIcon({ name }: { name: IconName }) {
  return (
    <img
      src={`/assets/editor/imgIcon${name}.svg`}
      alt=""
      className="shrink-0"
    />
  )
}
