require('dotenv').config({ path: 'token.env' });
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Basic storage paths
const DATA_DIR = path.join(__dirname, 'data');
const TEMP_DIR = path.join(DATA_DIR, 'temp');
const USER_IDS_FILE = path.join(DATA_DIR, 'user_ids.json');

// Create required folders if missing
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }
} catch (error) {
    console.error('Error creating directories:', error);
}

// Constants
const TELEGRAM_API_KEY = process.env.BOT_TOKEN;
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const GPT_API_KEY = process.env.GPT_API_KEY;
const ADMIN_IDS = ['331787333', '6226498083', '1411383596'];
const BROADCAST_PASSWORD = 'opo123';

// Channel IDs per language
const CHANNEL_ID_EN = "@opofinance_Official";
const CHANNEL_ID_FA = "@opofinance_fa";

// Promotion config
const promotions = {
    active: false,
    EN: {
        banner: '',
        caption: ''
    },
    FA: {
        banner: '',
        caption: ''
    }
};

// Timeframe labels (FA)
const timeframeTranslations = {
    FA: {
        "1 min": "۱ دقیقه",
        "5 min": "۵ دقیقه",
        "15 min": "۱۵ دقیقه",
        "30 min": "۳۰ دقیقه",
        "1 Hour": "۱ ساعت",
        "4 Hour": "۴ ساعت",
        "Daily": "روزانه",
        "Weekly": "هفتگی",
        "Monthly": "ماهانه"
    }
};

const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });

// Language texts and menu labels
const langOptions = {
    EN: {
        welcome: "Welcome to Opo Chartist AI Bot! Please select a currency pair from the list below:",
        selectCurrency: "You selected {currency}. Now choose a timeframe:",
        processing: "You selected {currency} ({timeframe}). Fetching analysis...",
        noNews: "No news available for the selected currency and timeframe.",
        analysisResult: "Analysis for {currency} ({timeframe}):\n\n{analysis}",
        error: "An error occurred. Please try again later.",
        chooseLang: "Please choose your language:",
        joinCTA: "🔔 Join our English Telegram channel [OpoFinance](https://t.me/opofinance_Official) to access this tool. After joining, click the button below to verify your membership.",
        notJoined: "❌ You are not a member of our English channel. Please join [OpoFinance](https://t.me/opofinance_Official) and try again.",
        analyzeAgain: "📊 Analyze Another Currency",
        contactUs: "🌐There are various ways to connect with us at Opofinance.\n👨🏻‍🏫Depending on the department you wish to reach, you can send us an ✉️email or start a conversation through our 💬website's chat section. Our team is always ready to assist you!",
        noActivePromo: "❌ There are no active promotions at this time. Please check back later!",
        socialMedia: "**🌟 Stay Connected with Opofinance! 🌟**\n\n📲Join our growing community on social media and never miss an update!\n\n🔔 Get the latest news, exclusive offers, and trading tips all in one place.\n\n💬 Engage with us and share your journey in the world of trading.\n\n🔗Click the links below to follow us and stay ahead:",
        opoApp: "**Trade Smarter, Anywhere, Anytime with the Opofinance App!**\n\n💡 Trading made easier than ever!\n\n🔸 Trade directly from your smartphone\n🔸 Free TradingView tools\n🔸 Instant deposits and withdrawals\n🔸 Complete account management\n🔸 Professional IB panel\n\n📲Download now and experience a new era of trading! 🌟",
        menuSetup: "✅ Menu setup complete. You can use the buttons below to access different features.",
        menuButtons: {
            contactUs: "☎️ Contact Us",
            promotions: "🎉 Promotions",
            socialMedia: "📱 Social Media",
            opoApp: "📲 Opo App",
            startAgain: "🔁 Start Again"
        },
        contactUsButtons: {
            website: "💬 Visit Website Chat",
            support: "✉️ Support Email",
            affiliate: "👥 Affiliate Email"
        },
        socialMediaButtons: {
            instagram: "📸 Instagram",
            linkedin: "💼 LinkedIn",
            twitter: "𝕏 Twitter",
            facebook: "👥 Facebook",
            telegram: "📢 Telegram Channel",
            youtube: "▶️ YouTube"
        },
        appButtons: {
            googlePlay: "📱 Google Play",
            appStore: "📱 App Store"
        }
    },
    FA: {
        welcome: "به Opo Chartist AI خوش آمدید. دستیار تحلیل بازار اپوفایننس. برای شروع یکی از جفت ارز‌های زیر را انتخاب کنید:",
        selectCurrency: "جفت ارز مورد نظر شما : {currency}\nحالا تایم فریم مورد نظر خود را انتخاب کنید:",
        processing: "تایم فریم {timeframe} برای جفت ارز {currency} انتخاب شد.\nدر حال پردازش اطلاعات...",
        noNews: "خبری برای جفت ارز و تایم فریم انتخاب شده یافت نشد.",
        analysisResult: "تحلیل برای {currency} ({timeframe}):\n\n{analysis}",
        error: "مشکلی پیش آمده است. لطفاً بعداً دوباره تلاش کنید.",
        chooseLang: "لطفاً زبان خود را انتخاب کنید:",
        joinCTA: "🔔 لطفاً ابتدا عضو کانال تلگرام [Opofinance](https://t.me/opofinance_fa) شوید و سپس روی دکمه زیر کلیک کنید.",
        notJoined: "❌ شما هنوز عضو کانال ما نشده‌اید. لطفاً به کانال [Opofinance](https://t.me/opofinance_fa) بپیوندید و دوباره تلاش کنید.",
        analyzeAgain: "📊 تحلیل جفت ارز دیگر",
        contactUs: "راه‌های مختلفی برای ارتباط با ما در اپوفایننس وجود دارد. با توجه به دپارتمان مورد نظر خود، می‌توانید برای ما ایمیل بفرستید یا از طریق بخش چت وب‌سایت با ما گفتگو کنید. تیم ما همیشه آماده پاسخگویی به شماست!",
        noActivePromo: "❌ در حال حاضر پروموشن فعالی وجود ندارد. لطفاً بعداً مراجعه کنید!",
        socialMedia: "**🌟 با اپوفایننس در ارتباط باشید! 🌟**\n\nبه خانواده ما در شبکه‌های اجتماعی بپیوندید و از جدیدترین اخبار و امکانات بی‌نظیر باخبر شوید! 🚀\n\n🔔 آخرین اخبار، پیشنهادات ویژه و نکات معامله‌گری را در یکجا دریافت کنید.\n\n💬 با ما در ارتباط باشید و تجربیات خود را در دنیای معامله‌گری به اشتراک بگذارید.\n\n📱 همین حالا روی لینک های زیر کلیک کنید و ما را دنبال کنید:",
        opoApp: "**با اپلیکیشن اپوفایننس، دنیای مالی همیشه در دسترسه!**\n\n💡 کارآمدتر از هر اپلیکیشن مالی دیگر!\n\n🔸 ترید مستقیم از موبایل\n🔸 ابزارهای رایگان TradingView\n🔸 واریز و برداشت آنی\n🔸 مدیریت کامل حساب های معاملاتی\n🔸 پنل حرفه‌ای IB\n\n📲همین حالا دانلود کنید و دنیای جدیدی از معاملات را تجربه کنید! 🌟",
        menuSetup: "✅ منو با موفقیت تنظیم شد. می‌توانید از دکمه‌های زیر برای دسترسی به امکانات مختلف استفاده کنید.",
        menuButtons: {
            contactUs: "☎️ تماس با ما",
            promotions: "🎉 پروموشن ها",
            socialMedia: "📱 شبکه های اجتماعی",
            opoApp: "📲 اپلیکیشن اپو",
            startAgain: "🔁 شروع دوباره"
        },
        contactUsButtons: {
            website: "💬 چت وب‌سایت",
            support: "✉️ ایمیل پشتیبانی",
            affiliate: "👥 ایمیل همکاری"
        },
        socialMediaButtons: {
            instagram: "📸 اینستاگرام",
            telegram: "📢 کانال تلگرام",
            youtube: "▶️ یوتیوب"
        },
        appButtons: {
            googlePlay: "📱 گوگل پلی",
            appStore: "📱 اپ استور"
        }
    }
};

// Supported pairs
const currencies = [
    { name: "EUR/USD", emoji: "🇪🇺🇺🇸" },
    { name: "GBP/USD", emoji: "🇬🇧🇺🇸" },
    { name: "AUD/USD", emoji: "🇦🇺🇺🇸" },
    { name: "NZD/USD", emoji: "🇳🇿🇺🇸" },
    { name: "USD/JPY", emoji: "🇺🇸🇯🇵" },
    { name: "USD/CHF", emoji: "🇺🇸🇨🇭" },
    { name: "USD/CAD", emoji: "🇺🇸🇨🇦" },
    { name: "XAU/USD", emoji: "🥇🇺🇸" }
];

const timeframes = [
    "1 min", "5 min", "15 min", "30 min", "1 Hour", "4 Hour", "Daily", "Weekly", "Monthly"
];

const userSessions = {};

// Map human-readable timeframe to API interval
function convertToAPIInterval(timeframe) {
    const map = {
        "1 min": "M1",
        "5 min": "M5",
        "15 min": "M15",
        "30 min": "M30",
        "1 Hour": "H1",
        "4 Hour": "H4",
        "Daily": "D1",
        "Weekly": "W1",
        "Monthly": "M1"
    };
    if (!map[timeframe]) console.warn("⚠️ Invalid timeframe input:", timeframe);
    return map[timeframe] || "M15";
}

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

function getRetryAfter(err) {
    // Try known locations for Telegram's retry_after value
    return (
        err?.response?.parameters?.retry_after ??
        err?.response?.body?.parameters?.retry_after ??
        err?.parameters?.retry_after ??
        null
    );
}

// Wrapper for Telegram sends that respects rate limits
async function sendWithRetry(sendFn) {
    try {
        return await sendFn();
    } catch (err) {
        const retry = getRetryAfter(err);
        if (retry) {
            await sleep((retry + 1) * 1000);
            return sendFn();
        }
        throw err;
    }
}

/**
 * Broadcast helper:
 * - Sends in parallel with limited concurrency
 * - Periodically updates progress
 * - Optionally collects failed user IDs
 */
async function fastBroadcast(userIds, perUserSend, onProgress, concurrency = 32, failedCollector = null) {
    let index = 0, ok = 0, fail = 0;

    async function worker() {
        while (true) {
            const i = index++;
            if (i >= userIds.length) break;

            const uid = userIds[i];
            try {
                await sendWithRetry(() => perUserSend(uid));
                ok++;
            } catch (e) {
                fail++;
                if (failedCollector) failedCollector.push(uid);
            }

            if ((ok + fail) % 25 === 0 || ok + fail === userIds.length) {
                await onProgress({ done: ok + fail, total: userIds.length, ok, fail });
            }
        }
    }

    const n = Math.min(concurrency, userIds.length);
    const workers = Array.from({ length: n }, () => worker());
    await Promise.all(workers);
    return { ok, fail };
}

// Load all saved user IDs
function loadUserIds() {
    try {
        return fs.existsSync(USER_IDS_FILE) ? JSON.parse(fs.readFileSync(USER_IDS_FILE, 'utf8')) : [];
    } catch (error) {
        console.error('Error loading user IDs:', error);
        return [];
    }
}

// Add a new user ID if not present
function saveUserId(userId) {
    try {
        const userIds = loadUserIds();
        if (!userIds.includes(userId)) {
            userIds.push(userId);
            fs.writeFileSync(USER_IDS_FILE, JSON.stringify(userIds, null, 2));
        }
    } catch (error) {
        console.error('Error saving user ID:', error);
    }
}

// Fetch headlines for a symbol from TradingView via RapidAPI
async function getLatestNews(symbol) {
    try {
        const formattedSymbol = 'FX:' + symbol.replace('/', '');
        console.log(`[News Fetch] Fetching news for: ${formattedSymbol}`);

        const response = await axios.get(`https://trading-view.p.rapidapi.com/news/list`, {
            headers: {
                "X-RapidAPI-Key": RAPID_API_KEY,
                "X-RapidAPI-Host": "trading-view.p.rapidapi.com"
            },
            params: {
                symbol: formattedSymbol,
                page: 1,
                per_page: 125,
                category: 'base',
                locale: 'en',
                country: 'us'
            }
        });

        console.log("[Full News API Response]:", response.data);

        if (!Array.isArray(response.data) || response.data.length === 0) {
            console.warn(`[News Fetch] No news found for ${formattedSymbol}`);
            return [];
        }

        const headlines = response.data
            .filter(item => item && item.title)
            .map(item => item.title.trim())
            .slice(0, 125);

        console.log(`[News Fetch] ${headlines.length} headlines fetched for ${formattedSymbol}`);

        return headlines;
    } catch (error) {
        console.error(`[News Fetch Error] Error fetching news for ${symbol}:`, error.response?.data || error.message);
        return [];
    }
}

// Pull technical data from custom analysis API
async function getTechnicalData(symbol, timeframe) {
    try {
        const cleanedSymbol = symbol.replace("/", "");
        let exchange = "OANDA";
        let screener = "forex";

        // Metals use different source
        const metalSymbols = ["XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD"];
        if (metalSymbols.includes(cleanedSymbol)) {
            exchange = "FX";
            screener = "cfd";
        }

        const interval = convertToAPIInterval(timeframe);

        console.log("[TechnicalData] Sending request with:", {
            symbol: cleanedSymbol,
            exchange,
            screener,
            interval
        });

        const response = await axios.post("http://37.27.88.159:5000/analysis", {
            symbol: cleanedSymbol,
            exchange,
            screener,
            interval,
            indicators: [
                "summary",
                "oscillators",
                "moving_averages",
                "change",
                "close",
                "high",
                "low",
                "open",
                "volume"
            ]
        });
        console.log("[TechData Raw Response]", response.data);

        if (!response.data || Object.keys(response.data).length === 0) {
            console.error(`[TechData Error] No data received from API for ${symbol} @ ${timeframe}`);
            return null;
        }

        return response.data;

    } catch (error) {
        console.error(
            `[TechnicalData] Error for ${symbol}@${timeframe}:`,
            error.response?.data || error.message
        );
        return null;
    }
}

// Prompt for GPT based on tech + news
function buildPrompt(currency, timeframe, tech, newsList, lang = "EN") {
    const news = newsList.slice(0, 5).join("\n");

    if (lang === "FA") {
        return `شما تحلیلگر بازار فارکس هستید. فقط بر اساس داده‌های زیر، یک تحلیل فاندامنتال و تکنیکال دقیق و مختصر برای ${currency} در تایم‌فریم ${timeframe} بنویس.

🔸 قیمت: ${tech.close}
🔸 روند MA: ${tech.summary.RECOMMENDATION}
🔸 مقاومت: ${tech.high}
🔸 حمایت: ${tech.low}

تیتر اخبار:
${news}

حداکثر ۴۵۰ کاراکتر. فقط تحلیل. خبرها را تکرار نکن.`;
    }

    return `You are a forex analyst. Based on the technical and news data below, write a clear and professional analysis for ${currency} (${timeframe} chart):

🔸 Price: ${tech.close}
🔸 MA Trend: ${tech.summary.RECOMMENDATION}
🔸 Resistance: ${tech.high}
🔸 Support: ${tech.low}

News:
${news}

Keep it <450 characters. Do not repeat the headlines. Deliver a short, smart analysis.`;
}

// Show main menu for selected language
function setupUserKeyboard(chatId, lang) {
    const buttons = langOptions[lang].menuButtons;
    bot.sendMessage(chatId, langOptions[lang].menuSetup, {
        reply_markup: {
            keyboard: [
                [buttons.contactUs, buttons.promotions],
                [buttons.socialMedia, buttons.opoApp],
                [buttons.startAgain]
            ],
            resize_keyboard: true
        }
    });
}

// Send final formatted analysis
const sendAnalysis = async (chatId, analysis, currency, selectedTimeframe, selectedLang) => {
    let cleanAnalysis = analysis.replace(/[*_`#]/g, '');

    const displayTimeframe = selectedLang === 'FA'
        ? timeframeTranslations.FA[selectedTimeframe] || selectedTimeframe
        : selectedTimeframe;

    await bot.sendMessage(
        chatId,
        langOptions[selectedLang].analysisResult
            .replace("{currency}", currency)
            .replace("{timeframe}", displayTimeframe)
            .replace("{analysis}", cleanAnalysis),
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: langOptions[selectedLang].analyzeAgain, callback_data: "analyze_again" }]
                ]
            }
        }
    );
};

// Main message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const isStartAgainEN = text === "🔁 Start Again";
    const isStartAgainFA = text === "🔁 شروع دوباره";
    if (isStartAgainEN || isStartAgainFA) {
        saveUserId(chatId);
        userSessions[chatId] = { step: 'chooseLang' };

        await bot.sendMessage(chatId, langOptions.EN.chooseLang, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🇬🇧 English", callback_data: "lang_EN" }, { text: "🇮🇷 فارسی", callback_data: "lang_FA" }]
                ]
            }
        });
        return;
    }

    // Ignore free text before language selection
    if (!userSessions[chatId]?.lang) return;

    const userLang = userSessions[chatId].lang;
    const lang = langOptions[userLang];
    const buttons = lang.menuButtons;

    // Contact Us
    if (text === buttons.contactUs) {
        const contactButtons = [
            [{ text: lang.contactUsButtons.website, url: "https://www.opofinance.com" }],
            [{ text: "✉️ support@opofinance.com", callback_data: "support_email" }],
            [{ text: "👥 affiliate@opofinance.com", callback_data: "affiliate_email" }]
        ];

        try {
            const bannerPath = `./assets/contact_banner_${userLang.toLowerCase()}.jpg`;

            if (fs.existsSync(bannerPath)) {
                await bot.sendPhoto(chatId, fs.createReadStream(bannerPath), {
                    caption: lang.contactUs,
                    parse_mode: 'Markdown',
                    reply_markup: JSON.stringify({
                        inline_keyboard: contactButtons
                    })
                });
            } else {
                await bot.sendMessage(chatId, lang.contactUs, {
                    parse_mode: 'Markdown',
                    reply_markup: JSON.stringify({
                        inline_keyboard: contactButtons
                    })
                });
            }
        } catch (error) {
            console.error('Contact button error:', error);
            await bot.sendMessage(chatId, lang.contactUs);
        }
    }
    // Promotions
    else if (text === buttons.promotions) {
        if (!promotions.active || !promotions[userLang].banner) {
            await bot.sendMessage(chatId, lang.noActivePromo);
            return;
        }
        try {
            await bot.sendPhoto(chatId, promotions[userLang].banner, {
                caption: promotions[userLang].caption,
                parse_mode: 'Markdown'
            });
        } catch (error) {
            await bot.sendMessage(chatId, promotions[userLang].caption, {
                parse_mode: 'Markdown'
            });
        }
    }
    // Social Media
    else if (text === buttons.socialMedia) {
        try {
            const bannerPath = `./assets/social_banner_${userLang.toLowerCase()}.jpg`;
            const socialLinks = userLang === 'EN' ? {
                instagram: "https://instagram.com/opofinance",
                linkedin: "https://www.linkedin.com/company/opofinanceofficial/",
                twitter: "https://x.com/opofinance?lang=en",
                facebook: "https://www.facebook.com/Opofinanceofficial/",
                telegram: "https://t.me/opofinance_Official",
                youtube: "https://www.youtube.com/@opofinanceofficial"
            } : {
                instagram: "https://www.instagram.com/opofinance_farsi/?hl=en",
                telegram: "https://t.me/opofinance_fa",
                youtube: "https://www.youtube.com/@opofinanceofficial"
            };

            const socialButtons = userLang === 'EN' ? [
                [{ text: lang.socialMediaButtons.instagram, url: socialLinks.instagram }],
                [{ text: lang.socialMediaButtons.linkedin, url: socialLinks.linkedin }],
                [{ text: lang.socialMediaButtons.twitter, url: socialLinks.twitter }],
                [{ text: lang.socialMediaButtons.facebook, url: socialLinks.facebook }],
                [{ text: lang.socialMediaButtons.telegram, url: socialLinks.telegram }],
                [{ text: lang.socialMediaButtons.youtube, url: socialLinks.youtube }]
            ] : [
                [{ text: lang.socialMediaButtons.instagram, url: socialLinks.instagram }],
                [{ text: lang.socialMediaButtons.telegram, url: socialLinks.telegram }],
                [{ text: lang.socialMediaButtons.youtube, url: socialLinks.youtube }]
            ];

            if (fs.existsSync(bannerPath)) {
                await bot.sendPhoto(chatId, fs.createReadStream(bannerPath), {
                    caption: lang.socialMedia,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: socialButtons
                    }
                });
            } else {
                await bot.sendMessage(chatId, lang.socialMedia, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: socialButtons
                    }
                });
            }
        } catch (error) {
            await bot.sendMessage(chatId, lang.socialMedia, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: socialButtons
                }
            });
        }
    }
    // Opo App
    else if (text === buttons.opoApp) {
        const bannerPath = `./assets/app_banner_${userLang.toLowerCase()}.jpg`;

        const appButton = userLang === 'EN'
            ? {
                text: "📲 Download Opofinance Application",
                url: "https://opofinance.com/application?utm_source=telegram&utm_medium=bot"
            }
            : {
                text: "📲 دانلود اپلیکیشن اپوفایننس",
                url: "https://opofinance.com/fa/application?utm_source=telegram&utm_medium=bot"
            };

        try {
            if (fs.existsSync(bannerPath)) {
                await bot.sendPhoto(chatId, fs.createReadStream(bannerPath), {
                    caption: lang.opoApp,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[appButton]]
                    }
                });
            } else {
                await bot.sendMessage(chatId, lang.opoApp, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[appButton]]
                    }
                });
            }
        } catch (error) {
            console.error('Opo App button error:', error);
            await bot.sendMessage(chatId, lang.opoApp, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[appButton]]
                }
            });
        }
    }
    // Start Again (menu button)
    else if (text === buttons.startAgain) {
        userSessions[chatId] = { step: 'chooseLang' };
        bot.sendMessage(chatId, langOptions.EN.chooseLang, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🇬🇧 English", callback_data: "lang_EN" }, { text: "🇮🇷 فارسی", callback_data: "lang_FA" }]
                ]
            }
        });
    }
});

// /start: register + language choice
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    saveUserId(chatId);
    userSessions[chatId] = { step: 'chooseLang' };
    bot.sendMessage(chatId, langOptions.EN.chooseLang, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🇬🇧 English", callback_data: "lang_EN" }, { text: "🇮🇷 فارسی", callback_data: "lang_FA" }]
            ]
        }
    });
});

// Set promotion (reply to photo)
bot.onText(/\/setpromotion (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    console.log('Setpromotion command received:', {
        chatId,
        match: match[1],
        hasPhoto: !!msg.reply_to_message?.photo
    });

    if (!ADMIN_IDS.includes(chatId.toString())) {
        await bot.sendMessage(chatId, "❌ Not authorized");
        return;
    }

    try {
        if (!msg.reply_to_message?.photo) {
            await bot.sendMessage(chatId, "❌ Please reply to a photo with this command");
            return;
        }

        const [password, lang, ...captionParts] = match[1].split(' ');
        console.log('Parsed command:', { password, lang, captionParts });

        if (password !== BROADCAST_PASSWORD) {
            await bot.sendMessage(chatId, "❌ Invalid password");
            return;
        }

        if (!['EN', 'FA'].includes(lang.toUpperCase())) {
            await bot.sendMessage(chatId, "❌ Invalid language. Use EN or FA");
            return;
        }

        const caption = captionParts.join(' ');
        const photoId = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id;

        promotions.active = true;
        promotions[lang.toUpperCase()].banner = photoId;
        promotions[lang.toUpperCase()].caption = caption;

        console.log('Promotion set:', {
            lang: lang.toUpperCase(),
            photoId,
            caption
        });

        await bot.sendPhoto(chatId, photoId, {
            caption: `✅ Promotion set for ${lang.toUpperCase()}:\n\n${caption}`,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Error in setpromotion:', error);
        await bot.sendMessage(chatId, "❌ Error setting promotion. Make sure to reply to a photo with this command.");
    }
});

// Clear promotions
bot.onText(/\/clearpromotion/, async (msg) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) {
        await bot.sendMessage(chatId, "❌ Not authorized");
        return;
    }

    promotions.active = false;
    promotions.EN = { banner: '', caption: '' };
    promotions.FA = { banner: '', caption: '' };

    await bot.sendMessage(chatId, "✅ Promotions cleared");
});

// Prepare broadcast (text or photo)
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) {
        await bot.sendMessage(chatId, "❌ Not authorized");
        return;
    }

    try {
        if (msg.reply_to_message?.photo) {
            const [password, ...messageParts] = match[1].split(' ');
            const message = messageParts.join(' ');
            if (password !== BROADCAST_PASSWORD) {
                await bot.sendMessage(chatId, "❌ Invalid password");
                return;
            }
            const photoId = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id;

            const broadcastData = {
                type: 'photo',
                photoId: photoId,
                message: message
            };
            const timestamp = Date.now();
            const broadcastPath = path.join(TEMP_DIR, `broadcast_${timestamp}.json`);
            fs.writeFileSync(broadcastPath, JSON.stringify(broadcastData));

            await bot.sendPhoto(chatId, photoId, {
                caption: message,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ Send", callback_data: `broadcast_${timestamp}` },
                        { text: "❌ Cancel", callback_data: "cancel_broadcast" }
                    ]]
                }
            });
        } else {
            const [password, ...messageParts] = match[1].split(' ');
            const message = messageParts.join(' ');

            if (password !== BROADCAST_PASSWORD) {
                await bot.sendMessage(chatId, "❌ Invalid password.");
                return;
            }

            await bot.sendMessage(
                chatId,
                `📢 Preview:\n\n${message}\n\nSend to all users?`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "✅ Send", callback_data: `confirm_broadcast_${Buffer.from(message).toString('base64')}` },
                            { text: "❌ Cancel", callback_data: "cancel_broadcast" }
                        ]]
                    }
                }
            );
        }
    } catch (error) {
        console.error('Broadcast error:', error);
        await bot.sendMessage(chatId, "❌ Error processing broadcast");
    }
});

// Show total registered users
bot.onText(/\/users/, async (msg) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) {
        await bot.sendMessage(chatId, "❌ You are not authorized to use this command.");
        return;
    }
    const userIds = loadUserIds();
    await bot.sendMessage(chatId, `📊 Total registered users: ${userIds.length}`);
});

// Handle inline buttons and actions
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
        if (data.startsWith("lang_")) {
            const selectedLang = data.split("_")[1];
            const channelIdToCheck = selectedLang === "EN" ? CHANNEL_ID_EN : CHANNEL_ID_FA;

            userSessions[chatId] = { lang: selectedLang, step: 'verifyJoin', channelId: channelIdToCheck };
            const lang = langOptions[selectedLang];

            setupUserKeyboard(chatId, selectedLang);

            try {
                const bannerPath = `./assets/banner_${selectedLang.toLowerCase()}.png`;
                const joinMessage = lang.joinCTA;
                if (fs.existsSync(bannerPath)) {
                    await bot.sendPhoto(chatId, fs.createReadStream(bannerPath), {
                        caption: joinMessage,
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "✅ I Joined", callback_data: "verify_join" }]
                            ]
                        }
                    });
                } else {
                    await bot.sendMessage(chatId, joinMessage, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "✅ I Joined", callback_data: "verify_join" }]
                            ]
                        }
                    });
                }
            } catch (error) {
                await bot.sendMessage(chatId, lang.joinCTA, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "✅ I Joined", callback_data: "verify_join" }]
                        ]
                    }
                });
            }
        } else if (data === "verify_join") {
            const session = userSessions[chatId];
            if (!session) {
                return;
            }
            const channelIdToCheck = session.channelId;
            const userLang = session.lang;
            const lang = langOptions[userLang];
            try {
                const memberStatus = await bot.getChatMember(channelIdToCheck, chatId);
                if (["member", "administrator", "creator"].includes(memberStatus.status)) {
                    userSessions[chatId].step = 'chooseCurrency';
                    await bot.sendMessage(chatId, lang.welcome, {
                        reply_markup: {
                            inline_keyboard: currencies.map((currency) => [
                                { text: `${currency.emoji} ${currency.name}`, callback_data: `currency_${currency.name}` }
                            ])
                        }
                    });
                } else {
                    await bot.sendMessage(chatId, lang.notJoined, {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "✅ I Joined", callback_data: "verify_join" }]
                            ]
                        }
                    });
                }
            } catch (error) {
                console.error("Error verifying user:", error.message);
                await bot.sendMessage(chatId, lang.error);
            }
        } else if (data.startsWith("currency_")) {
            const selectedCurrency = data.split("_")[1];
            if (!userSessions[chatId]) return;
            userSessions[chatId].currency = selectedCurrency;
            userSessions[chatId].step = 'chooseTimeframe';
            const lang = langOptions[userSessions[chatId].lang];
            const translatedTimeframes = userSessions[chatId].lang === "FA"
                ? ["۱ دقیقه", "۵ دقیقه", "۱۵ دقیقه", "۳۰ دقیقه", "۱ ساعت", "۴ ساعت", "روزانه", "هفتگی", "ماهانه"]
                : timeframes;

            await bot.sendMessage(chatId, lang.selectCurrency.replace("{currency}", selectedCurrency), {
                reply_markup: {
                    inline_keyboard: translatedTimeframes.map((timeframe, index) => [
                        { text: timeframe, callback_data: `timeframe_${timeframes[index]}` }
                    ])
                }
            });
        } else if (data.startsWith("timeframe_")) {
            const selectedTimeframe = data.split("_")[1];
            const session = userSessions[chatId];
            if (!session) return;
            const { currency, lang: selectedLang } = session;
            const lang = langOptions[selectedLang];
            const displayTimeframe = selectedLang === 'FA'
                ? timeframeTranslations.FA[selectedTimeframe] || selectedTimeframe
                : selectedTimeframe;

            await bot.sendMessage(chatId, lang.processing
                .replace("{currency}", currency)
                .replace("{timeframe}", displayTimeframe)
            );

            try {
                console.log(`[Analysis Triggered] User: ${chatId}, Pair: ${currency}, Timeframe: ${selectedTimeframe}, Lang: ${selectedLang}`);

                const [techData, newsHeadlines] = await Promise.all([
                    getTechnicalData(currency, selectedTimeframe),
                    getLatestNews(currency)
                ]);

                if (!techData) {
                    console.error(`[TechData Error] No data received from technical API for ${currency} @ ${selectedTimeframe}`);
                    await bot.sendMessage(chatId, lang.error + "\n(Technical data unavailable)");
                    return;
                }

                if (newsHeadlines.length === 0) {
                    console.warn(`[News Error] No news headlines available for ${currency}`);
                    await bot.sendMessage(chatId, lang.noNews);
                    return;
                }

                const prompt = buildPrompt(currency, selectedTimeframe, techData, newsHeadlines, selectedLang);
                console.log(`[GPT Prompt] Built prompt:\n${prompt}`);

                const gptResponse = await axios.post(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: selectedLang === "FA"
                                    ? "شما تحلیلگر حرفه‌ای بازار هستید. بر اساس داده، تحلیل ترکیبی دقیق بدهید."
                                    : "You are a financial analyst. Based on the provided data, give a short, useful analysis."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        max_tokens: 1000,
                        temperature: 0.5
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${GPT_API_KEY}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const analysis = gptResponse.data.choices[0]?.message?.content?.trim();

                if (!analysis) {
                    console.error(`[GPT Error] Empty response received for ${currency} (${selectedTimeframe})`);
                    await bot.sendMessage(chatId, lang.error + "\n(No analysis generated)");
                    return;
                }

                console.log(`[GPT Success] Analysis generated:\n${analysis}`);

                await sendAnalysis(chatId, analysis, currency, selectedTimeframe, selectedLang);

            } catch (error) {
                const errMsg = error.response?.data || error.message || error.toString();
                console.error(`[Analysis Handler Error] Currency: ${currency}, Timeframe: ${selectedTimeframe}, User: ${chatId}\nError:\n`, errMsg);
                await bot.sendMessage(chatId, lang.error + "\n(Error: " + errMsg + ")");
            }
        } else if (data === "analyze_again") {
            const session = userSessions[chatId];
            if (!session) return;
            const lang = session.lang;
            userSessions[chatId] = {
                lang: lang,
                step: 'chooseCurrency'
            };

            await bot.sendMessage(chatId, langOptions[lang].welcome, {
                reply_markup: {
                    inline_keyboard: currencies.map((currency) => [
                        { text: `${currency.emoji} ${currency.name}`, callback_data: `currency_${currency.name}` }
                    ])
                }
            });
        }
        // Broadcast from staged photo payload
        else if (data.startsWith('broadcast_')) {
            if (!ADMIN_IDS.includes(chatId.toString())) {
                await bot.answerCallbackQuery(query.id, "Not authorized");
                return;
            }

            try {
                const timestamp = data.split('_')[1];
                const broadcastPath = path.join(TEMP_DIR, `broadcast_${timestamp}.json`);
                const broadcastData = JSON.parse(fs.readFileSync(broadcastPath));

                const statusMessage = await bot.sendMessage(chatId, "📡 Broadcasting...");
                const userIds = loadUserIds();
                const failedIds = [];

                const perUserSend = async (userId) => {
                    await bot.sendPhoto(userId, broadcastData.photoId, {
                        caption: broadcastData.message,
                        parse_mode: 'Markdown'
                    });
                };

                const onProgress = async ({ done, total, ok, fail }) => {
                    try {
                        await bot.editMessageText(
                            `📡 Broadcasting: ${done}/${total}\nSuccessful: ${ok}\nFailed: ${fail}`,
                            { chat_id: chatId, message_id: statusMessage.message_id }
                        );
                    } catch (_) {}
                };

                const { ok: successful, fail: failed } = await fastBroadcast(
                    userIds, perUserSend, onProgress, 32, failedIds
                );

                if (fs.existsSync(broadcastPath)) {
                    fs.unlinkSync(broadcastPath);
                }

                await bot.editMessageText(
                    `📊 Broadcast Complete\n\n` +
                    `Total Users: ${userIds.length}\n` +
                    `✅ Successful: ${successful}\n` +
                    `❌ Failed: ${failed}\n\n` +
                    `Success Rate: ${((successful / userIds.length) * 100).toFixed(1)}%`,
                    { chat_id: chatId, message_id: statusMessage.message_id }
                );

                if (failedIds.length > 0) {
                    const failedIdsPath = path.join(DATA_DIR, `failed_broadcasts_${Date.now()}.json`);
                    fs.writeFileSync(failedIdsPath, JSON.stringify(failedIds, null, 2));
                    await bot.sendMessage(chatId, `⚠️ Some broadcasts failed. Failed IDs saved to ${path.basename(failedIdsPath)}`);
                }
            } catch (error) {
                console.error('Error in photo broadcast:', error);
                await bot.sendMessage(chatId, "❌ Error processing photo broadcast");
            }
        }
        // Broadcast plain text
        else if (data.startsWith('confirm_broadcast_')) {
            if (!ADMIN_IDS.includes(chatId.toString())) {
                await bot.answerCallbackQuery(query.id, "Not authorized");
                return;
            }

            const messageBase64 = data.replace('confirm_broadcast_', '');
            const message = Buffer.from(messageBase64, 'base64').toString();
            const statusMessage = await bot.sendMessage(chatId, "📡 Broadcasting...");

            const userIds = loadUserIds();
            let successful = 0;
            let failed = 0;
            const failedIds = [];

            for (const userId of userIds) {
                try {
                    await bot.sendMessage(userId, message);
                    successful++;

                    if (successful % 10 === 0 || successful === userIds.length) {
                        await bot.editMessageText(
                            `📡 Broadcasting: ${successful}/${userIds.length}\nSuccessful: ${successful}\nFailed: ${failed}`,
                            {
                                chat_id: chatId,
                                message_id: statusMessage.message_id
                            }
                        );
                    }
                } catch (error) {
                    failed++;
                    failedIds.push(userId);
                    console.error(`Failed to send to ${userId}:`, error.message);
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            await bot.editMessageText(
                `📊 Broadcast Complete\n\n` +
                `Total Users: ${userIds.length}\n` +
                `✅ Successful: ${successful}\n` +
                `❌ Failed: ${failed}\n\n` +
                `Success Rate: ${((successful / userIds.length) * 100).toFixed(1)}%`,
                {
                    chat_id: chatId,
                    message_id: statusMessage.message_id
                }
            );

            if (failedIds.length > 0) {
                const failedIdsPath = path.join(DATA_DIR, `failed_broadcasts_${Date.now()}.json`);
                fs.writeFileSync(failedIdsPath, JSON.stringify(failedIds, null, 2));
                await bot.sendMessage(chatId, `⚠️ Some broadcasts failed. Failed IDs saved to ${path.basename(failedIdsPath)}`);
            }
        }
        // Cancel broadcast
        else if (data === 'cancel_broadcast') {
            if (!ADMIN_IDS.includes(chatId.toString())) {
                await bot.answerCallbackQuery(query.id, "Not authorized");
                return;
            }

            await bot.editMessageText(
                "❌ Broadcast cancelled.",
                {
                    chat_id: chatId,
                    message_id: query.message.message_id
                }
            );
        } else if (query.data === "support_email" || query.data === "affiliate_email") {
            await bot.answerCallbackQuery(query.id, {
                text: query.data === "support_email"
                    ? "Support Email: support@opofinance.com"
                    : "Affiliate Email: affiliate@opofinance.com",
                show_alert: true
            });
        }
    } catch (error) {
        console.error("Global Error:", error);
        await bot.sendMessage(chatId, "An unexpected error occurred. Please try again.");
    }
});

// Log bot errors
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('Bot is running...');
