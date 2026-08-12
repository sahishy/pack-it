import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'

const LabeledSlider = ({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    valueLabel,
    leftHint,
    rightHint,
    containerClassName = '',
}) => (
    <Field className={containerClassName}>
        {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
        {valueLabel ? <p className='text-base font-semibold text-primary0'>{valueLabel}</p> : null}
        <Slider
            id={id}
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(nextValue) => {
                const normalizedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue

                if (Number.isFinite(normalizedValue)) {
                    onChange?.(normalizedValue)
                }
            }}
        />
        <div className='flex items-center justify-between'>
            <span className='text-xs text-neutral1'>{leftHint}</span>
            <span className='text-xs text-neutral1'>{rightHint}</span>
        </div>
    </Field>
)

export default LabeledSlider
