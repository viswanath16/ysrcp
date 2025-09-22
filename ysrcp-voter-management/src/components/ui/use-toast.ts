'use client'

export type ToastOptions = {
	title?: string
	description?: string
	variant?: 'default' | 'destructive'
}

export function useToast() {
	function toast(options: ToastOptions) {
		const message = `${options.title ?? ''}${options.title && options.description ? ' - ' : ''}${options.description ?? ''}`
		if (options.variant === 'destructive') {
			console.error(message)
		} else {
			console.log(message)
		}
	}
	return { toast }
}
