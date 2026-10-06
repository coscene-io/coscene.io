import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import './robot-data-miniature-select.css'

type Props<T extends string> = {
  label: string
  value: T | ''
  options: readonly { value: T; label: string; index?: string; disabled?: boolean }[]
  onChange: (value: T) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  side?: 'top' | 'bottom'
}

export function MiniatureSelect<T extends string>({ label, value, options, onChange, disabled, placeholder, className = '', side = 'bottom' }: Props<T>) {
  return <Select.Root value={value} onValueChange={value => onChange(value as T)} disabled={disabled}>
    <Select.Trigger className={`mi-select-trigger ${className}`} aria-label={label} data-scene-controls>
      <span className="mi-select-value"><Select.Value placeholder={placeholder} /></span>
      <Select.Icon className="mi-select-chevron"><ChevronDown size={16} aria-hidden="true" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="mi-select-menu" position="popper" side={side} align="start" sideOffset={8} collisionPadding={12} data-scene-controls>
        <Select.ScrollUpButton className="mi-select-scroll"><ChevronUp size={16} /></Select.ScrollUpButton>
        <Select.Viewport className="mi-select-options">
          {options.map(option => <Select.Item className="mi-select-option" value={option.value} key={option.value} disabled={option.disabled} textValue={option.label}>
            {option.index && <span className="mi-select-index" aria-hidden="true">{option.index}</span>}
            <Select.ItemText>{option.label}</Select.ItemText>
            <Select.ItemIndicator className="mi-select-check"><Check size={16} aria-hidden="true" /></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="mi-select-scroll"><ChevronDown size={16} /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
}
