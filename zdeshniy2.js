import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import express from "express";

const bot = new Telegraf(process.env.BOT_TOKEN);
const options = ["Месть сурка в 18:00", "Месть сурка в 20:00", "Месть сурка в 22:00"];
const votesFile = "./votes.json";

let votes = {}; // {user_id: choice}

// ================== Работа с файлом ==================
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

// ================== Клавиатура ==================
function getKeyboard() {
    return Markup.keyboard(options.map(opt => [opt]))
        .resize()
        .oneTime(false);
}

// ================== Загрузка голосов ==================
loadVotes();

// ================== Команда /start ==================
bot.start(ctx => {
    ctx.reply("📊 Выбери время проведения «Месть сурка»", getKeyboard());
});

// ================== Обработчик текста ==================
bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    if (!options.includes(text)) return; // игнорируем всё, кроме вариантов

    votes[userId] = text; // сохраняем выбор пользователя
    saveVotes();

    // Подсчёт голосов
    const counts = {};
    options.forEach(opt => counts[opt] = 0);
    Object.values(votes).forEach(v => counts[v]++);

    // Формируем текст результата
    let resultText = "📊 Результат голосования:\n";
    options.forEach(opt => resultText += `${opt}: ${counts[opt]} голосов\n`);

    // Отправляем обновлённый результат в чат
    await ctx.reply(resultText);
});

// ================== Запуск бота ==================
bot.launch();
console.log("Бот запущен...");

// ================== HTTP-сервер для Render ==================
const app = express();

app.get("/", (req, res) => {
    res.send("Bot is running");
});

const PORT = process.env.PORT || 10000; // Render автоматически подставляет порт
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
