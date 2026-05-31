import { Minus, Plus } from 'lucide-react'

export default function Counter({
  value,
  unit,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  disabled,
}) {
  return (
    <div className="counter-container">
      <button
        type="button"
        className="counter-btn"
        onClick={onDecrease}
        disabled={disabled || decreaseDisabled}
      >
        <Minus size={20} />
      </button>
      <div className="counter-value">
        <span className="number">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      <button
        type="button"
        className="counter-btn"
        onClick={onIncrease}
        disabled={disabled || increaseDisabled}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
