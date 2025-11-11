# Chartist-ai

Chartist-ai is a production Telegram bot that delivers short technical and news-based analyses for major FX pairs in English and Farsi, built originally for a forex broker community.

The bot combines:
- Live technical data from a custom analysis API
- Recent headlines from TradingView (via RapidAPI)
- Short generated summaries based on that data
- Simple growth tools: channel join gate, broadcasts, and promo banners

---

## Features

- **Multi-language**: English (`EN`) and Farsi (`FA`) flows with separate texts and channels.
- **Join gate**: Users must join the specified Telegram channel before accessing analysis.
- **Symbol & timeframe picker**: Inline keyboards for common FX pairs and multiple timeframes.
- **Automated analysis**:
  - Fetches technical snapshot for the selected pair/timeframe.
  - Pulls recent news headlines.
  - Builds a concise combined analysis using the OpenAI Chat Completions API.
- **Menu shortcuts**:
  - Contact options
  - Active promotions (set by admins)
  - Social media links
  - App download CTA
- **Admin tools**:
  - `/users` — show total registered users
  - `/setpromotion` — set promo banner + caption per language (reply to a photo)
  - `/clearpromotion` — clear promos
  - `/broadcast` — staged broadcast (text or photo) with confirmation and progress
- **Broadcast engine**:
  - Saves user IDs
  - Parallel sending with rate limit handling and simple reporting

---

## Tech Stack

- Node.js
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- Axios
- OpenAI Chat Completions API
- TradingView (RapidAPI endpoint)
- Custom technical-analysis API (HTTP endpoint)
- File system for simple persistence (`user_ids.json`, temp broadcast files)

---

## Project Structure

- `index.js` (or main file): bot logic, handlers, admin commands
- `data/`
  - `user_ids.json` — stored subscriber IDs
  - `temp/` — temporary broadcast payloads
- `assets/`
  - Optional banners for contact, social, app, language-specific prompts

Folders are created automatically if missing.

---

## Environment Variables

Create a `token.env` file in the root:

```env
BOT_TOKEN=your_telegram_bot_token
RAPID_API_KEY=your_rapidapi_key
GPT_API_KEY=your_openai_api_key

