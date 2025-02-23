// components/markdown.tsx
import ReactMarkdown from "react-markdown"

export function Markdown({ content }: { content: string }) {
	return <ReactMarkdown>{content}</ReactMarkdown>
}
