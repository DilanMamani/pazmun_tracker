type Props = {
  name: string
  className?: string
}

export default function Icon({ name, className }: Props) {
  return (
    <svg className={`icon ${className ?? ''}`} aria-hidden="true">
      <use href={`/icons.svg#${name}-icon`} />
    </svg>
  )
}
