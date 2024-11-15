
import * as dotenv from 'dotenv';
const { Telegram } = require('puregram')

const { QuestionManager } = require('puregram-question');


import prisma from './module/prisma';
import { User_Registration } from './module/registration';
import { CallbackQueryContext, InlineKeyboard, MessageContext } from 'puregram';
import { HearManager } from '@puregram/hear';
import { commandUserRoutes } from './command';


dotenv.config();

// Загрузка из .env, задание параметров
const token: string = process.env.TELEGRAM_TOKEN || '';

export const telegram = Telegram.fromToken(process.env.TOKEN)

const questionManager = new QuestionManager();
//telegram.updates.use(questionManager.middleware);
const hearManager = new HearManager()
telegram.updates.on('message', hearManager.middleware)
commandUserRoutes(hearManager)

telegram.updates.on('message', async (context: MessageContext) => {
    // Проверяем, является ли сообщение текстовым
    console.log(context)
    
	//await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест2`, attachment: `photo200840769_457273112` } )
	//Модуль вызова пкметра
	//const pk_counter_st = await Counter_PK_Module(context)
	//console.log(users_pk)
	//if (pk_counter_st) { return }
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.account.findFirst({ where: { idvk: context.from?.id } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) { await User_Registration(context); return }
	//await Online_Set(context)
	//await Keyboard_Index(context, `⌛ Загрузка, пожалуйста подождите...`)
	return;
});

// Обработка нажатий на инлайн-кнопки
telegram.updates.on('callback_query', async (context: CallbackQueryContext) => {
    console.log(context)
    const { queryPayload, message } = context;

    if (!message || !message.from) {
        return; // Игнорируем, если сообщение или чат отсутствуют
    }

    // Обработка нажатий на кнопки
    if (queryPayload === 'success_processing_of_personal_data') {
        await telegram.api.sendMessage({ chat_id: message.chat.id, text: 'Вы согласны на обработку персональных данных.' });
    } else if (queryPayload === 'denied_processing_of_personal_data') {
        await telegram.api.sendMessage({ chat_id: message.chat.id, text: 'Вы не согласны на обработку персональных данных.' });
    }

    // Подтверждаем нажатие кнопки
    await telegram.api.answerCallbackQuery(context.id);
});

// Запускаем сервер Telegram
telegram.updates.startPolling().then(
    () => console.log(`@${telegram.bot.username} started polling`)
  )
/*
telegram.updates.on('message', async (msg: any) => {
    // Создаем клавиатуру
    const keyboard = {
        keyboard: [
            [
                { text: 'Да!' }, // Кнопка "Да"
                { text: 'Нет!' }   // Кнопка "Нет"
            ]
        ],
        resize_keyboard: true,
        one_time: true,
    };
    await msg.send('Согласны-ли Вы на обработку персональных данных?', { reply_markup: keyboard });
    const answer = await msg.question(
        'Нажмите кнопку'
    );

    if (!/да|yes|согласен|конечно/i.test(answer.text)) {
        await msg.send('Тогда, мы не можем совершить регистрацию', { reply_markup: null });

        return;
    }

    await msg.send('Отлично, тогда продолжим');

    const age = await msg.question('Введите Ваш возраст');
    const email = await msg.question('Введите Ваш имейл');
    const phone = await msg.question('Введите Ваш номер телефона');

    await msg.send(
        `Возраст: ${age.text}\nЭл. адрес: ${email.text}\nТелефон: ${phone.text}`
    );
});


*/