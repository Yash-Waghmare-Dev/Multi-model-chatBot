# n8n Agent Assistant - Production Ready

A modern, modular React-based chat application that connects to n8n agents through multiple categories with multi-language support and text-to-speech functionality.

## Features

✅ **Multi-Category Support**: Share Market, Astrology, Wellness  
✅ **Multi-Language**: English, Hindi, Marathi, Bengali, Tamil, Telugu  
✅ **Text-to-Speech**: Native browser speech synthesis  
✅ **Real-time Translation**: Google Cloud Translation integration  
✅ **Error Boundary**: Graceful error handling  
✅ **Production Logging**: Structured logging for debugging  
✅ **Type-Safe**: Full TypeScript support  
✅ **Modular Architecture**: Separated concerns and reusable hooks

## Project Structure

```
src/
├── components/          # React components
│   ├── CategorySelection.tsx
│   ├── ChatLayout.tsx
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
│   ├── useChat.ts      # Chat logic
│   ├── useTranslation.ts # Translation logic
│   └── useSpeech.ts    # Speech synthesis
├── types/              # TypeScript types
├── constants/          # App constants
├── config/             # Configuration
├── utils/              # Utilities
│   └── logger.ts       # Logging
├── App.tsx             # Main component
└── main.tsx            # Entry point
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_WEBHOOK_URL=https://your-webhook-url.com/webhook/...
VITE_GOOGLE_PROJECT_ID=your-google-project-id  # For translations
```

### Required Variables

- `VITE_WEBHOOK_URL`: The webhook endpoint for the n8n agent

### Optional Variables

- `VITE_GOOGLE_PROJECT_ID`: Google Cloud project ID for text translation

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Production Build

```bash
npm run build
```

This generates optimized production files in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## API Integration

### Webhook Format

The app sends POST requests to your webhook with the following format:

```json
{
  "category": "Share Market|Astrology|Wellness",
  "text": "user message"
}
```

Expected response:

```json
{
  "output": "agent response text"
}
```

### Category Mapping

| Internal Key   | Webhook Value  |
| -------------- | -------------- |
| `share-market` | `share-market` |
| `astrology`    | `Astrology`    |
| `wellness`     | `wellness`     |

## Error Handling

- **Error Boundary**: Catches React component errors and displays a fallback UI
- **Logging**: All errors are logged with timestamps and context
- **User Feedback**: User-friendly error messages in the chat

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Lazy loading of translation library
- Memoized callbacks and components
- Efficient re-render optimization with hooks

## Security

- Type-safe API calls
- XSS protection via React
- No sensitive data in logs (production mode)

## Troubleshooting

### Translation not working

- Verify `VITE_GOOGLE_PROJECT_ID` is set in environment
- Check Google Cloud credentials

### Webhook requests failing

- Verify `VITE_WEBHOOK_URL` is correct
- Check CORS settings on webhook server
- Review browser console for detailed errors

### Speech synthesis not working

- Ensure browser supports Web Speech API
- Check system audio settings

## Production Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy the `dist/` directory to your hosting service

3. Set environment variables on your hosting platform

4. Ensure webhook URL is accessible from production environment

5. Test all categories and languages

6. Monitor logs for any runtime errors

## Contributing

When adding new features:

1. Follow the modular component structure
2. Add proper TypeScript types
3. Use the logger for debugging
4. Update error handling if needed
5. Test in production mode

## License

[Add your license here]
