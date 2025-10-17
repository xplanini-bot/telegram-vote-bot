import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

const options = ["23:00", "19:00"];
let votes = {}; // {user_id: choice}

// Генерация ReplyKeyboardMarkup
function getKeyboard() {
    return Markup.keyboard(options.map(opt => [opt]))
                 .resize()
                 .oneTime(false);
}

// Команда /start
bot.command("start", (ctx) => {
    ctx.reply(
        "📊 Когда тебе удобно участвовать в ивенте Тропический лес?\n(Выбери вариант из клавиатуры)",
        getKeyboard()
    );
});

// Обработчик текста
bot.on("text", (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Проверяем, что текст — это один из вариантов
    if (!options.includes(text)) return;

    // Симулируем внутреннюю команду /vote <choice>
    handleVote(userId, chatId, text, ctx);
});

// Функция подсчета голосов и отправки результатов
function handleVote(userId, chatId, choice, ctx) {
    votes[userId] = choice;

    // Подсчет голосов
    const counts = {};
    options.forEach(opt => counts[opt] = 0);
    Object.values(votes).forEach(v => counts[v]++);

    // Сообщение пользователю
    ctx.reply(`Ты выбрал: ${choice}`);

    // Общий результат в чат
    let resultText = "📊 Общий результат голосования:\n";
    options.forEach(opt => resultText += `${opt}: ${counts[opt]} голосов\n`);

    ctx.reply(resultText);
}

bot.launch();
console.log("Бот запущен...");
