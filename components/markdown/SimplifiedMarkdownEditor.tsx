"use client"

import { useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Link as LinkIcon, List } from "lucide-react"

interface SimplifiedMarkdownEditorProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
}

export default function SimplifiedMarkdownEditor({
	value,
	onChange,
	placeholder,
}: SimplifiedMarkdownEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const wrapSelection = (prefix: string, suffix: string = prefix) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const selectedText = value.substring(start, end)

		const newValue =
			value.substring(0, start) +
			prefix +
			selectedText +
			suffix +
			value.substring(end)

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(start + prefix.length, end + prefix.length)
		}, 0)
	}

	const insertAtCursor = (text: string) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const start = textarea.selectionStart
		const newValue = value.substring(0, start) + text + value.substring(start)

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(start + text.length, start + text.length)
		}, 0)
	}

	const handleBold = () => wrapSelection("**")
	const handleItalic = () => wrapSelection("*")
	const handleLink = () => {
		const url = prompt("Enter URL:")
		if (url) wrapSelection("[", `](${url})`)
	}
	const handleList = () => insertAtCursor("\n- ")

	return (
		<div className="space-y-2">
			<div className="flex gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleBold}
					className="h-8 w-8 p-0 hover:bg-gray-200"
					title="Bold"
					aria-label="Apply bold formatting"
				>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleItalic}
					className="h-8 w-8 p-0 hover:bg-gray-200"
					title="Italic"
					aria-label="Apply italic formatting"
				>
					<Italic className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleLink}
					className="h-8 w-8 p-0 hover:bg-gray-200"
					title="Link"
					aria-label="Insert link"
				>
					<LinkIcon className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleList}
					className="h-8 w-8 p-0 hover:bg-gray-200"
					title="Bullet List"
					aria-label="Insert bullet list"
				>
					<List className="h-4 w-4" />
				</Button>
			</div>
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="font-mono text-sm min-h-[250px] rounded-t-none border-t-0"
			/>
			<p className="text-xs text-gray-500">
				Use the buttons above to format your text with Markdown
			</p>
		</div>
	)
}
