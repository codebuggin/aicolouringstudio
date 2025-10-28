# **App Name**: AI Coloring Studio

## Core Features:

- Prompt Submission: Takes user input prompt for generating coloring page.
- AI Image Generation: Generates a coloring page based on the user-provided text prompt using an external webhook to process and create image and PDF.
- Image Display: Displays the generated image in a preview box once available.
- PDF Download: Provides a 'Download PDF' button that links to the generated PDF file.
- Webhook Integration: Integrates with a specified n8n webhook (https://abu.awsaibot.com/webhook-test/80c8c795-1bb5-499e-b70e-b1c3221a0f40) to process image generation requests with the JSON payload `{ "prompt": "<user input>" }`.
- Loading Animation: Displays a loader animation while the image is being generated, indicating the app's processing state.

## Style Guidelines:

- Background color: Light gray (#f9f9fb) to provide a clean and premium feel, similar to Apple's design style.
- Primary color: Deep gray (#111827) for text and main elements to ensure readability and a sleek look.
- Accent color: A slightly lighter gray (#e5e7eb) used for secondary elements, providing subtle contrast and a soft interface.
- Font: 'Inter', a sans-serif font for headlines and body text. Note: currently only Google Fonts are supported.
- Centered hero section with rounded input box and a glossy black 'Generate Image' button for a clean, focused user experience.
- Subtle fade-in animations for the hero section and smooth hover transitions on buttons (slight scale + shadow) for a modern, engaging feel.