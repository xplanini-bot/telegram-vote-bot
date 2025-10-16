from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import asyncio

import os
TOKEN = os.getenv("BOT_TOKEN")  # читает токен из Environment
bot = Bot(token=TOKEN)

bot = Bot(token=TOKEN)
dp = Dispatcher()

votes = {}  # {user_id: choice}
options = ["23:00", "19:00"]

@dp.message(Command("start"))
async def start_poll(message: types.Message):
    # Создаём клавиатуру в поле ввода
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[[types.KeyboardButton(text=opt)] for opt in options],
        resize_keyboard=True,
        one_time_keyboard=False
    )

    await message.answer(
        "📊 Когда тебе удобно учавствовать в ивенте Тропический лес?\n(Выбери вариант из выпадающего меню)",
        reply_markup=keyboard
    )

@dp.message()
async def handle_vote(message: types.Message):
    choice = message.text
    user_id = message.from_user.id

    if choice not in options:
        return  # Игнорируем другие сообщения

    # Сохраняем или обновляем голос пользователя
    votes[user_id] = choice

    # Подсчёт голосов
    counts = {opt: 0 for opt in options}
    for c in votes.values():
        counts[c] += 1

    # Сообщение с индивидуальным выбором
    await message.answer(f"Ты выбрал: {choice}")

    # Сообщение с общим результатом
    result_text = "📊 Общий результат голосования:\n"
    for opt in options:
        result_text += f"{opt}: {counts[opt]} голосов\n"

    await message.answer(result_text)

async def main():
    # Запуск бота в бесконечном цикле
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
