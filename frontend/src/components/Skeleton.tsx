/** Shimmering loading placeholder block. Style via className (size/shape). */
export default function Skeleton({
  className = "",
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return <span className={`block skeleton rounded-lg ${className}`} style={style} />
}
