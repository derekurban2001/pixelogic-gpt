import type { StreamingTextResponse } from 'ai'

/**
 * @class
 * @summary Handles the receiving part of a chat conversation using GPT streaming.
 * @description The class provides a method to process streaming responses from GPT.
 */
export default class ChatGptReceiver {
	/**
	 * @method
	 * @async
	 * @summary Process the streaming response from GPT.
	 * @param {StreamingTextResponse} streamResponse - The streaming response from the GPT model.
	 * @param {{
	 *    onStart: () => void,
	 *    onToken: (token: string) => void,
	 *    onError: (error: string) => void,
	 *    onCompletion: () => void
	 * }} callbacks - Callbacks for various stages of the chat completion.
	 * @throws {Error} - Throws an error if the streamResponse is invalid, or if reading from the stream fails.
	 * @returns {Promise<void>} - Returns a Promise that resolves when the stream is successfully processed.
	 */
	public async processGptStream(
		streamResponse: StreamingTextResponse,
		callbacks: {
			onStart?: () => void
			onToken: (token: string) => void
			onError?: (error: string) => void
			onCompletion?: () => void
		},
	): Promise<void> {
		try {
			// Call the onStart callback if defined
			if (callbacks?.onStart) callbacks.onStart()

			// Validate if streamResponse and its properties exist
			if (!streamResponse || typeof streamResponse !== 'object' || !streamResponse.body)
				throw new Error('Invalid stream response provided.')

			// Ensure the response is okay
			if (!streamResponse.ok) throw new Error(`API call failed: ${streamResponse.statusText}`)

			// Handle the streaming response using the readable stream feature
			const reader = streamResponse.body.getReader()

			// This internal function recursively reads chunks and processes them
			const readNextChunk = async () => {
				try {
					const { done, value } = await reader.read()

					if (done) {
						// Call the onCompletion callback if defined
						if (callbacks?.onCompletion) callbacks.onCompletion()
						console.log('Stream completed.')
						return
					}

					// Update the SvelteKit store
					const decodedValue = new TextDecoder().decode(value)
					callbacks.onToken(decodedValue)

					// Read the next chunk
					await readNextChunk()
				} catch (readError) {
					// Call the onError callback if defined
					if (callbacks?.onError) callbacks.onError(String(readError))

					console.error('Error reading from the stream:', readError)
					throw readError
				}
			}

			// Start reading chunks
			await readNextChunk()
		} catch (error) {
			// Log the error and re-throw it
			console.error('Error in processGptStream:', error)
			throw error
		}
	}
}
