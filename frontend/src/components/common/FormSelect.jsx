import { Field, FieldLabel } from '@/components/ui/field'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const getOptionValue = (option) => typeof option === 'string' ? option : option?.value
const getOptionLabel = (option) => typeof option === 'string' ? option : option?.label ?? option?.value ?? ''
const getOptionAlias = (option) => typeof option === 'string' ? '' : option?.alias ?? ''
const getOptionDisplayText = (option) => {
    if (!option) return ''
    const optionLabel = getOptionLabel(option)
    const optionAlias = getOptionAlias(option)
    return optionAlias ? `${optionLabel} (${optionAlias})` : optionLabel
}

const FormSelect = ({
    label,
    id,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
}) => {
    return (
        <Field className={containerClassName}>
            {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
            <Select value={value || null} onValueChange={onChange}>
                <SelectTrigger id={id} className={`w-full ${className}`}>
                    <SelectValue placeholder={placeholder}>
                        {(selectedValue) => {
                            if (selectedValue == null || selectedValue === '') return placeholder
                            const selectedOption = options.find((option) => getOptionValue(option) === selectedValue)
                            return getOptionDisplayText(selectedOption) || String(selectedValue)
                        }}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent align='start'>
                    {options.map((option) => {
                        const optionValue = getOptionValue(option)

                        return (
                            <SelectItem key={optionValue} value={optionValue}>
                                {getOptionDisplayText(option)}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </Field>
    )
}

export default FormSelect
