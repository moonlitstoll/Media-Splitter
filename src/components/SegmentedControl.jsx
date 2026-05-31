export default function SegmentedControl({ options, value, onChange, disabled }) {
  return (
    <div className="segmented-control">
      {options.map((option) => {
        const isActive = value === option.value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            className={`segmented-control-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            {Icon ? <Icon size={16} /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
