import { Shield, Zap, Hash, HardDrive, Clock } from 'lucide-react'
import SegmentedControl from './SegmentedControl'
import Counter from './Counter'
import { formatMegabytes, formatTime } from '../utils/formatTime'
import { estimatePartCount } from '../utils/splitPlan'

const ENCODING_OPTIONS = [
  { value: 'compatible', label: 'Compatible', icon: Shield },
  { value: 'fast', label: 'Fast', icon: Zap },
]

const SPLIT_MODE_OPTIONS = [
  { value: 'parts', label: 'Equal Parts', icon: Hash },
  { value: 'size', label: 'By Size', icon: HardDrive },
  { value: 'time', label: 'By Time', icon: Clock },
]

const COUNTER_CONFIG = {
  parts: {
    unit: 'Parts',
    min: 2,
    step: 1,
    getDecreaseDisabled: (value) => value <= 2,
    decrease: (value) => Math.max(2, value - 1),
    increase: (value) => value + 1,
  },
  size: {
    unit: 'MB',
    min: 1,
    step: 5,
    getDecreaseDisabled: (value) => value <= 1,
    decrease: (value) => Math.max(1, value - 5),
    increase: (value) => value + 5,
  },
  time: {
    unit: 'Secs',
    min: 10,
    step: 10,
    getDecreaseDisabled: (value) => value <= 10,
    decrease: (value) => Math.max(10, value - 10),
    increase: (value) => value + 10,
  },
}

export default function SplitOptions({
  file,
  fileDuration,
  encodingMode,
  onEncodingModeChange,
  splitMode,
  onSplitModeChange,
  parts,
  onPartsChange,
  splitSize,
  onSplitSizeChange,
  splitTime,
  onSplitTimeChange,
  disabled,
}) {
  const counterValues = { parts, size: splitSize, time: splitTime }
  const counterSetters = {
    parts: onPartsChange,
    size: onSplitSizeChange,
    time: onSplitTimeChange,
  }
  const counterConfig = COUNTER_CONFIG[splitMode]
  const counterValue = counterValues[splitMode]
  const setCounterValue = counterSetters[splitMode]

  return (
    <div className="split-options">
      <label className="field-label">Encoding Mode</label>
      <SegmentedControl
        options={ENCODING_OPTIONS}
        value={encodingMode}
        onChange={onEncodingModeChange}
        disabled={disabled}
      />

      {encodingMode === 'compatible' ? (
        <div className="info-badge info-badge-compatible">
          <Shield size={14} />
          Re-encodes for perfect seeking and playback. Slightly slower.
        </div>
      ) : (
        <div className="info-badge info-badge-fast">
          <Zap size={14} />
          Stream copy: instant speed, but seeking may not work on some players.
        </div>
      )}

      <label className="field-label">Select Split Options</label>
      <SegmentedControl
        options={SPLIT_MODE_OPTIONS}
        value={splitMode}
        onChange={onSplitModeChange}
        disabled={disabled}
      />

      {file ? (
        <div className="split-info-row">
          <div className="info-badge total-info">
            Total:
            <span className="font-black">{formatTime(fileDuration)}</span>
            <span className="divider">/</span>
            <span className="font-black">{formatMegabytes(file.size)} MB</span>
          </div>

          {splitMode === 'parts' ? (
            <div className="info-badge part-info">
              Per split approx:
              <span className="font-black">{formatTime(fileDuration / parts)}</span>
              <span className="divider">/</span>
              <span className="font-black">{formatMegabytes(file.size / parts)} MB</span>
            </div>
          ) : (
            <div className="info-badge part-info">
              Est. Parts:
              <span className="font-black">
                {estimatePartCount({
                  splitMode,
                  duration: fileDuration,
                  fileSize: file.size,
                  parts,
                  splitSize,
                  splitTime,
                })}
              </span>
            </div>
          )}
        </div>
      ) : null}

      <div className="counter-section">
        <Counter
          value={counterValue}
          unit={counterConfig.unit}
          onDecrease={() => setCounterValue(counterConfig.decrease(counterValue))}
          onIncrease={() => setCounterValue(counterConfig.increase(counterValue))}
          decreaseDisabled={counterConfig.getDecreaseDisabled(counterValue)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
