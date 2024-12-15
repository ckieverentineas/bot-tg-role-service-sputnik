import { Context, Markup } from "telegraf";
import prisma from "../prisma";
import { InlineKeyboard, InlineKeyboardBuilder, KeyboardBuilder, MessageContext } from "puregram";
import { chat_id_system, telegram } from "../..";
import { Logger, Send_Message, Send_Message_NotSelf } from "../helper";
//import { Keyboard_Index, Logger, Send_Message, User_Info } from "./helper";

export async function User_Registration(context: MessageContext) {
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '✏', payload: { cmd: 'success_processing_of_personal_data' } })
    .textButton({ text: '👣', payload: { cmd: 'denied_processing_of_personal_data' } })
    // Согласие на обработку
    await context.send(`
        ⚠ Что вам следует знать о Спутнике: 
        ⭐ Любая форма рекламы запрещена; 
        ⭐ Мы не поддерживаем ненормативную лексику; 
        ⭐ При написании анкеты избегайте непристойных и грязных слов и выражений;
        ⭐ Весь пошлый контент крайне рекомендуется оставить для личной переписки;
        ⭐ Помните, что Спутник — бот для поиска соигрока, а не площадка для личных бесед;
        ⭐ Соблюдайте уважение к участникам сообщества.
        🚀 Коротко: рекомендуется без пиара, мата, грязи, пошлости и флуда в анкетах. Спутник — не притон.
        📜 Распишитесь здесь о своем согласии на обработку персональных данных и подтвердите, что вы обязуетесь соблюдать вышеизложенные рекомендации. 
        💬 У вас есть 10 минут на принятие решения!`, { reply_markup: keyboard }
    );
    /*
    if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
        await context.send('⌛ Вы отказались дать свое согласие. Если что, заглядывайте на чай');
        return;
    }
    //приветствие игрока
    const visit: any = await context.question(`⌛ Поставив свою подпись, вы увидели Хранителя Спутника, который что-то писал на листке пергамента.`,
        { 	
            keyboard: Keyboard.builder()
            .textButton({ label: '🖐 Подойти и поздороваться', payload: { cmd: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: '⏰ Ждать, пока Хранитель закончит', payload: { cmd: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
            answerTimeLimit
        }
    );
    if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
    const save = await prisma.account.create({	data: {	idvk: context.senderId } })
    const info = await User_Info(context)
    await context.send(`⌛ Хранитель вас увидел и сказал:\n — Добро пожаловать в Спутник! \n ⚖Вы зарегистрировались в системе, ${info.first_name}\n 🕯 GUID: ${save.id}. \n 🎥 idvk: ${save.idvk}\n ⚰ Дата Регистрации: ${save.crdate}\n`)
    await Logger(`In database created new user with uid [${save.id}] and idvk [${context.senderId}]`)
    /*await context.send(`⚠ Настоятельно рекомендуем ознакомиться с инструкцией эксплуатации системы "Центробанк Магомира":`,{ 	
        keyboard: Keyboard.builder()
        .urlButton({ label: '⚡ Инструкция', url: `https://vk.com/@bank_mm-instrukciya-po-polzovaniu-botom-centrobanka-magomira` }).row().inline(),
        answerTimeLimit
    })*/
    //const ans_selector = `⁉ @id${save.idvk}(${info.first_name}) легально регистрируется в Спутнике под GUID: ${save.id}!`
    //await Send_Message(chat_id, ans_selector)
    //await Keyboard_Index(context, `💡 Подсказка: Базовая команда [!спутник] без квадратных скобочек!`)
}

export async function Denied_Processing_Of_Personal_Data(message: MessageContext) {
    const save_check = await prisma.account.findFirst({ where: { idvk: message.chat.id }})
    if (save_check) { return }
    await Send_Message(message, '⌛ Вы отказались дать свое согласие. Если что, заглядывайте на чай');
}

export async function Success_Processing_Of_Personal_Data(message: MessageContext) {
    if (!message.chat.username) {
        return await Send_Message(message, '⚠ Установите username в настройках профиля своего аккаунта Telegram!')
    }
    const save_check = await prisma.account.findFirst({ where: { idvk: message.chat.id }})
    if (save_check) { return }
    await Send_Message(message, '⌛ Поставив свою подпись, вы увидели Хранителя Спутника, который что-то писал на листке пергамента.');
    const save = await prisma.account.create({	data: {	idvk: message.chat.id, username: message.chat?.username } })
    const keyboard = new KeyboardBuilder().textButton('!спутник').textButton(`!пкметр`).resize()
    await Send_Message(message, `⌛ Хранитель вас увидел и сказал:\n — Добро пожаловать в Спутник! \n ⚖Вы зарегистрировались в системе, ${message.chat.firstName}\n 🕯 GUID: ${save.id}. \n 🎥 idtg: ${save.idvk}\n ⚰ Дата Регистрации: ${save.crdate}\n`, keyboard)
    const ans_selector = `⁉ @${save.username} легально регистрируется в Спутнике под GUID: ${save.id}!`
    await Send_Message_NotSelf(Number(chat_id_system), ans_selector)
    await Logger(`(registration user) ~ new user with <uid> [${save.id}] by @${save.username}`)
}