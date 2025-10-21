import 'dotenv/config';
import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import express from "express";

const bot = new Telegraf(process.env.BOT_TOKEN);
const options = ["Месть сурка в 18:00", "Месть сурка в 20:00", "Месть сурка в 22:00"];
const votesFile = "./votes.json";

let votes = {}; // { user_id: choice }

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

// ================== Проверка администратора ==================
async function isAdmin(ctx) {
    try {
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;

        const admins = await ctx.telegram.getChatAdministrators(chatId);

        console.log("🔍 Проверка администратора:");
        console.log("Чат ID:", chatId);
        console.log("Пользователь ID:", userId, "-", ctx.from.username || ctx.from.first_name);
        console.log("Список админов:");
        admins.forEach(a => {
            console.log(`  → ${a.user.id} (${a.user.username || a.user.first_name})`);
        });

        // Если сообщение пришло от анонимного администратора
        if (ctx.message.sender_chat) {
            console.log("Сообщение от анонимного администратора:", ctx.message.sender_chat.id);
            return true; // разрешаем
        }

        return admins.some(admin => admin.user.id === userId);
    } catch (err) {
        console.error("Ошибка при проверке администратора:", err);
        return false;
    }
}


// ================== Загрузка голосов ==================
loadVotes();

// ================== Команда /start ==================
bot.start(async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) {
        await ctx.reply("🚫 Только администраторы могут запускать голосование.");
        return;
    }

    ctx.reply("📊 Выбери время проведения «Месть сурка»", getKeyboard());
});

// ================== Обработчик текста ==================
bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    if (!options.includes(text)) return;

    votes[userId] = text;
    saveVotes();

    // Подсчет голосов
    const counts = {};
    options.forEach(opt => counts[opt] = 0);
    Object.values(votes).forEach(v => counts[v]++);

    let resultText = "📊 Результаты голосования:\n";
    options.forEach(opt => {
        resultText += `${opt}: ${counts[opt]} голосов\n`;
    });

    await ctx.reply(resultText);
});

// ================== Команда /reset ==================
bot.command("reset", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) {
        await ctx.reply("🚫 Только администраторы могут сбросить результаты голосования.");
        return;
    }

    votes = {};
    saveVotes();
    await ctx.reply("🔄 Результаты голосования сброшены!");
});

// ================== Запуск бота ==================
bot.launch();
console.log("Бот запущен...");

// ================== HTTP-сервер для Render ==================
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
