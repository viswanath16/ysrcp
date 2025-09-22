'use client'

import * as React from 'react'

function Base({ as: Comp = 'div', className = '', ...props }: any) {
	return <Comp className={className} {...props} />
}

export const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
	<Base className={`rounded-lg border border-gray-200 bg-white shadow-md ${props.className ?? ''}`} {...props} />
)
export const CardHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
	<Base className={`border-b border-gray-100 p-6 ${props.className ?? ''}`} {...props} />
)
export const CardTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
	<Base as="h3" className={`text-3xl font-extrabold tracking-tight text-gray-950 ${props.className ?? ''}`} {...props} />
)
export const CardDescription = (props: React.HTMLAttributes<HTMLParagraphElement>) => (
	<Base as="p" className={`text-base text-gray-700 ${props.className ?? ''}`} {...props} />
)
export const CardContent = (props: React.HTMLAttributes<HTMLDivElement>) => (
	<Base className={`p-6 ${props.className ?? ''}`} {...props} />
)
