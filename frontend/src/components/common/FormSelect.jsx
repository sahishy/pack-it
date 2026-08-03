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
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent align='start'>
                    {options.map((option) => {
                        const optionValue = getOptionValue(option)
                        const optionLabel = getOptionLabel(option)
                        const optionAlias = getOptionAlias(option)

                        return (
                            <SelectItem key={optionValue} value={optionValue}>
                                {optionLabel}
                                {optionAlias ? ` (${optionAlias})` : ''}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </Field>
    )
}

export default FormSelect
