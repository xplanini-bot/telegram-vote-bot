import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";
import fs from "fs";

const bot = new Telegraf(process.env.BOT_TOKEN);

const options = ["Месть сурка в 18:00", "Месть сурка в 20:00", "Месть сурка в 22:00"];
const votesFile = "./votes.json";
let votes = {}; // {user_id: choice}

// Функции для работы с файлом голосов
function loadVotes() {
    try {
        if (fs.existsSync(votesFile)) {
            const data = fs.readFileSync(votesFile, "utf8");
            votes = JSON.parse(data);
        }
    } catch (err) {
        console.error("Ошибка при чтении голосов:", err);
        votes = {};
    }
}

function saveVotes() {
    try {
        fs.writeFileSync(votesFile, JSON.stringify(votes, null, 2));
    } catch (err) {
        console.error("Ошибка при сохранении голосов:", err);
    }
}

// Генерация ReplyKeyboardMarkup
function getKeyboard() {
    return Markup.keyboard(options.map(opt => [opt]))
                 .resize()
                 .oneTime(false);
}

// Загружаем голоса при старте
loadVotes();

// Команда /start
bot.start(ctx => {
    ctx.reply("📊 Выбери время проведения Месть сурка", getKeyboard());
});

// Обработчик текста
bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    if (!options.includes(text)) return;

    await handleVote(userId, ctx, text);
});

// Функция подсчета голосов и отправки результатов
async function handleVote(userId, ctx, choice) {
    votes[userId] = choice;
    saveVotes(); // сохраняем сразу после изменения

    // Подсчет голосов
    const counts = {};
    options.forEach(opt => counts[opt] = 0);
    Object.values(votes).forEach(v => counts[v]++);

    let resultText = "📊 Результат голосования:\n";
    options.forEach(opt => resultText += `${opt} : ${counts[opt]} голосов\n`);

    // Отправляем результат в группу
    await ctx.reply(resultText);
    
    // Убираем клавиатуру только у пользователя через личное сообщение
    await ctx.telegram.sendMessage(userId, "Можно будет проголосовать повторно через минуту", { reply_markup: { remove_keyboard: true } });

    // Через 60 секунд снова отправляем клавиатуру пользователю
    setTimeout(async () => {
        await ctx.telegram.sendMessage(
            userId,
            "Можно изменить вариант голосования",
            { reply_markup: getKeyboard().reply_markup }
        );
    }, 60000);

}

bot.launch();
console.log("Бот запущен...");
