import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const FormInput = ({
    label,
    error,
    containerClassName = '',
    className = '',
    id,
    ...props
}) => (
    <Field className={containerClassName} data-invalid={Boolean(error)}>
        {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
        <Input id={id} className={className} aria-invalid={Boolean(error)} {...props} />
        {error ? <FieldError>{error}</FieldError> : null}
    </Field>
)

export default FormInput
