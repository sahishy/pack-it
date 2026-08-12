import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const WORD_INTERVAL_MS = 90
const SKIP_REVEAL_TAGS = new Set(['code', 'pre'])

const rehypeFadeLatestWord = () => (tree) => {
    let latestTextNode = null

    const findLatestTextNode = (node, parent = null, index = -1, skip = false) => {
        const shouldSkip = skip || SKIP_REVEAL_TAGS.has(node.tagName)

        if (node.type === 'text' && !shouldSkip && /\S/.test(node.value)) {
            latestTextNode = { node, parent, index }
        }

        node.children?.forEach((child, childIndex) => {
            findLatestTextNode(child, node, childIndex, shouldSkip)
        })
    }

    findLatestTextNode(tree)
    if (!latestTextNode?.parent) return

    const { node, parent, index } = latestTextNode
    const match = node.value.match(/^([\s\S]*?)(\S+)(\s*)$/)
    if (!match) return

    const [, prefix, word, suffix] = match
    parent.children.splice(index, 1,
        ...(prefix ? [{ type: 'text', value: prefix }] : []),
        {
            type: 'element',
            tagName: 'span',
            properties: { className: ['inline-block', 'animate-[chat-latest-word_520ms_ease-out_both]', '[will-change:opacity,filter,transform]', 'motion-reduce:animate-none'] },
            children: [{ type: 'text', value: word }],
        },
        ...(suffix ? [{ type: 'text', value: suffix }] : []),
    )
}

const markdownComponents = {
    a: ({ children, href }) => <a href={href} target='_blank' rel='noreferrer' className='font-medium underline underline-offset-4'>{children}</a>,
    blockquote: ({ children }) => <blockquote className='my-3 border-l-2 pl-3 text-muted-foreground'>{children}</blockquote>,
    code: ({ children }) => <code className='rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]'>{children}</code>,
    h1: ({ children }) => <h1 className='mb-2 mt-4 text-base font-semibold first:mt-0'>{children}</h1>,
    h2: ({ children }) => <h2 className='mb-2 mt-4 font-semibold first:mt-0'>{children}</h2>,
    h3: ({ children }) => <h3 className='mb-1.5 mt-3 font-semibold first:mt-0'>{children}</h3>,
    hr: () => <hr className='my-4 border-border' />,
    li: ({ children }) => <li className='pl-0.5'>{children}</li>,
    ol: ({ children }) => <ol className='my-2 list-decimal space-y-1 pl-5'>{children}</ol>,
    p: ({ children }) => <p className='mt-2 leading-6 first:mt-0'>{children}</p>,
    pre: ({ children }) => <pre className='my-3 max-w-full overflow-x-auto rounded-lg bg-background/80 p-3 text-xs leading-5'>{children}</pre>,
    strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
    ul: ({ children }) => <ul className='my-2 list-disc space-y-1 pl-5'>{children}</ul>,
}

const MarkdownContent = ({ children, fadeLatestWord = false }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={fadeLatestWord ? [rehypeFadeLatestWord] : []}
        components={markdownComponents}
    >
        {children}
    </ReactMarkdown>
)

const ChatMarkdown = ({ content, animate = false }) => {
    const words = useMemo(() => content.match(/\S+\s*|\s+/g) ?? [], [content])
    const [visibleWordCount, setVisibleWordCount] = useState(animate ? 1 : words.length)
    const [measuredWidth, setMeasuredWidth] = useState(null)
    const rootRef = useRef(null)
    const measurementRef = useRef(null)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shouldReveal = animate && !reduceMotion && words.length > 1

    useEffect(() => {
        if (!shouldReveal) return undefined

        let nextWordCount = 1

        const interval = window.setInterval(() => {
            nextWordCount += 1
            setVisibleWordCount(nextWordCount)

            if (nextWordCount >= words.length) window.clearInterval(interval)
        }, WORD_INTERVAL_MS)

        return () => window.clearInterval(interval)
    }, [shouldReveal, words])

    useLayoutEffect(() => {
        if (!animate) return undefined

        const root = rootRef.current
        const measurement = measurementRef.current
        const message = root?.closest('[data-slot="message"]')
        if (!root || !measurement || !message) return undefined

        const measure = () => {
            const availableContentWidth = Math.max((message.clientWidth * 0.9) - 32, 1)
            measurement.style.maxWidth = `${availableContentWidth}px`
            setMeasuredWidth(Math.ceil(measurement.getBoundingClientRect().width))
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(message)

        return () => observer.disconnect()
    }, [animate, content])

    const visibleContent = shouldReveal
        ? words.slice(0, visibleWordCount).join('')
        : content
    const isRevealing = shouldReveal && visibleWordCount < words.length

    return (
        <div
            ref={rootRef}
            className='chat-markdown min-w-0 wrap-break-word'
            style={animate && measuredWidth ? { width: `${measuredWidth}px`, maxWidth: '100%' } : undefined}
        >
            <MarkdownContent fadeLatestWord={isRevealing}>{visibleContent}</MarkdownContent>
            {animate ? (
                <div ref={measurementRef} aria-hidden='true' className='chat-markdown pointer-events-none fixed -left-[10000px] top-0 w-max invisible wrap-break-word'>
                    <MarkdownContent>{content}</MarkdownContent>
                </div>
            ) : null}
        </div>
    )
}

export default ChatMarkdown
