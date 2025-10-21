import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

const options = ["Месть сурка в 18:00", "Месть сурка в 20:00", "Месть сурка в 22:00"];
let votes = {}; // {user_id: choice}

// Генерация ReplyKeyboardMarkup
function getKeyboard() {
    return Markup.keyboard(options.map(opt => [opt]))
                 .resize()
                 .oneTime(false);
}

// Команда /start
bot.start(ctx => {
    ctx.reply("📊 Выбери время проведения Месть сурка", getKeyboard());
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

    // Общий результат в чат
    let resultText = "📊 Результат голосования:\n";
    options.forEach(opt => resultText += `${opt} : ${counts[opt]} голосов\n`);

    ctx.reply(resultText, Markup.removeKeyboard()); //убрать клавиатуру

    setTimeout(() => {
    ctx.reply(" ", getKeyboard()); // снова показываем кнопки, пустой текст
}, 60000);

}

bot.launch();
console.log("Бот запущен...");
