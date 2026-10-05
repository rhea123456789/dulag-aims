type SealProps = {
  size?: number
  className?: string
}

export function Seal({ size = 64, className = '' }: SealProps) {
  return (
    <img
      className={`seal ${className}`.trim()}
      src="/dulag-seal.png"
      width={size}
      height={size}
      alt="Official seal of the Municipality of Dulag, Leyte"
    />
  )
}
