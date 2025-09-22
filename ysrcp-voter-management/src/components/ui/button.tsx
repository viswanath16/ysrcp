'use client'

import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className = '', disabled, ...props }: ButtonProps) {
	const base = 'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
	return <button className={`${base} ${className}`} disabled={disabled} {...props} />
}
