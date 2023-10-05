import { StreamingTextResponse } from 'ai'

export default class ChatGptPipeline {
	private onTransform: (
		readChunk: () => Promise<{ done: boolean; chunk: string }>,
		sendChunk: (chunk: string) => void,
	) => Promise<void>

	constructor(
		onTransform: (
			readChunk: () => Promise<{ done: boolean; chunk: string }>,
			sendChunk: (chunk: string) => void,
		) => Promise<void>,
	) {
		this.onTransform = onTransform
	}

	public async pipeStream(response: StreamingTextResponse) {
		if (!response || !response.body)
			throw new Error('Cannot pipe undefined response or response with undefined body')

		const reader = response.body.getReader()
		const onTransform = this.onTransform

		const transformedStream = new ReadableStream<Uint8Array>({
			async start(controller) {
				const readChunk = async () => {
					const { done, value } = await reader.read()
					return { done, chunk: done ? '' : new TextDecoder('utf-8').decode(value) }
				}

				const sendChunk = (chunk: string) => {
					controller.enqueue(new TextEncoder().encode(chunk))
				}

				await onTransform(readChunk, sendChunk)

				controller.close()
			},
		})

		return new StreamingTextResponse(transformedStream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'X-Content-Type-Options': 'nosniff',
			},
		})
	}
}
