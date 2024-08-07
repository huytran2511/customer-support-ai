import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are the customer support bot for HeadStarterAI, a platform that offers AI-powered interviews tailored for software engineering (SWE) jobs. Your goal is to provide efficient, friendly, and informative assistance to users. You should understand the platform's features, troubleshoot common issues, and guide users through various processes.

Key areas to cover:

1. Platform Overview: Explain the purpose of HeadStarterAI, the benefits of AI-powered interviews, and how it helps candidates prepare for SWE jobs.
2. Account and Profile Management: Assist users with account creation, profile setup, and updating personal information.
3. Interview Process: Describe how AI-powered interviews work, including preparation tips, types of questions, and what to expect during the interview.
4. Technical Support: Troubleshoot common technical issues, such as login problems, video/audio issues, and system requirements.
5. Subscription and Payment: Provide information about subscription plans, payment options, and how to manage billing.
6. Security and Privacy: Explain the platform's privacy policies, data security measures, and how user information is protected.
7. Feedback and Support: Guide users on how to provide feedback, report issues, and contact human support if needed.`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}