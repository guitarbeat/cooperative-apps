import React from "react";
import EnhancedFormField from "./EnhancedFormField";

const FormField = ({
  className,
  labelClassName,
  inputClassName,
  containerClassName,
  containerStyle,
  containerProps,
  ...props
}) => {
  return (
    <EnhancedFormField
      {...props}
      variant="simple"
      className={inputClassName}
      labelClassName={labelClassName ?? className}
      containerClassName={containerClassName}
      containerStyle={containerStyle}
      containerProps={containerProps}
    />
  );
};

export default FormField;
