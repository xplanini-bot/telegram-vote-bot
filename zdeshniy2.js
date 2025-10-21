import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";
import fs from "fs";

const bot = new Telegraf(process.env.BOT_TOKEN);

const options = ["Месть сурка в 18:00", "Месть сурка в 20:00", "Месть сурка в 22:00"];
const votesFile = "./votes.json";
let votes = {}; // {user_id: choice}
let cooldown = {}; // {user_id: timestamp когда можно голосовать снова}

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
    const now = Date.now();

    if (!options.includes(text)) return;

    // Проверяем, находится ли пользователь на "cooldown"
    if (cooldown[userId] && now < cooldown[userId]) {
        await ctx.telegram.sendMessage(userId, "⏳ Подожди минуту перед повторным голосованием");
        return;
    }

    // Устанавливаем блокировку на 60 секунд
    cooldown[userId] = now + 60 * 1000;

    // Обработка голосования
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

    // Отправляем результат в группу (всем)
    await ctx.reply(resultText);

    // Лично пользователю уведомление о блокировке
    await ctx.telegram.sendMessage(userId, "✅ Можно проголосовать повторно через минуту");
}

bot.launch();
console.log("Бот запущен...");
