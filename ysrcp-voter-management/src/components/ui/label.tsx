'use client'

import * as React from 'react'

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className = '', ...props }: LabelProps) {
	const base = 'text-sm font-medium text-gray-700'
	return <label className={`${base} ${className}`} {...props} />
}
