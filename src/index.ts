
import * as dotenv from 'dotenv';
const { Telegram } = require('puregram')

const { QuestionManager } = require('puregram-question');


import prisma from './module/prisma';
import { Denied_Processing_Of_Personal_Data, Success_Processing_Of_Personal_Data, User_Registration } from './module/account/registration';
import { CallbackQueryContext, InlineKeyboard, MessageContext } from 'puregram';
import { HearManager } from '@puregram/hear';
import { commandUserRoutes } from './command';
import { Logger } from './module/helper';
import { Sub_Menu } from './module/menu/sub';
import { Main_Menu } from './module/menu/main';
import { Blank_Create, Blank_Create_Prefab_Input_ON, Blank_Delete, Blank_Self } from './module/account/blank';
import { Counter_PK_Module } from './module/other/pk_metr';
import { Input_Module } from './module/other/input';


dotenv.config();

// Загрузка из .env, задание параметров
const token: string = process.env.TELEGRAM_TOKEN || '';

export const telegram = Telegram.fromToken(process.env.TOKEN)

const questionManager = new QuestionManager();
//telegram.updates.use(questionManager.middleware);
const hearManager = new HearManager()
telegram.updates.on('message', hearManager.middleware)
commandUserRoutes(hearManager)

// хранилище для пкметра и режимов
export const users_pk: Array<{ idvk: number, text: string, mode: 'main' | 'pkmetr' | 'input', operation: string }> = []

telegram.updates.on('message', async (context: MessageContext) => {
    // Проверяем, является ли сообщение текстовым
    //console.log(context)
    
	//await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест2`, attachment: `photo200840769_457273112` } )
	//Модуль вызова пкметра
	const pk_counter_st = await Counter_PK_Module(context)
	//console.log(users_pk)
	if (pk_counter_st) { return }
    const input_st = await Input_Module(context)
	//console.log(users_pk)
	if (input_st) { return }
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.account.findFirst({ where: { idvk: context.from?.id } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) { await User_Registration(context); return }
	//await Online_Set(context)
	//await Keyboard_Index(context, `⌛ Загрузка, пожалуйста подождите...`)
	return;
});

// Обработка нажатий на инлайн-кнопки
telegram.updates.on('callback_query', async (query: CallbackQueryContext) => {
    
    //console.log(context)
    const { queryPayload, message } = query;

    if (!message || !message.from) {
        return; // Игнорируем, если сообщение или чат отсутствуют
    }
    
    const config: Record<string, Function> = {
        "success_processing_of_personal_data": Success_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Принятие
        "denied_processing_of_personal_data": Denied_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Отклонение
        'main_menu': Main_Menu, // 0 Меню
        'sub_menu': Sub_Menu, // 0 Подменю
        'blank_self': Blank_Self, // 2 Анкета Главная
        'blank_create': Blank_Create, // 2 Анкета Подтверждение создания
        'blank_create_prefab_input_on': Blank_Create_Prefab_Input_ON, // 2 Анкета активация режима ввода
        'blank_delete': Blank_Delete, // 2 Анкета Удаление бланка
    };
    
    const command: string | any = queryPayload;
    if (typeof command != 'string') { return }
    
    if (config.hasOwnProperty(command)) {
        try {
            await config[command](message);
            //await message.editMessageReplyMarkup({ inline_keyboard: [] });
        } catch (e) {
            await Logger(`Error event detected for command '${command}': ${e}`);
        }
    } else {
        await Logger(`Unknown command: '${command}'`);
    }
    // Подтверждаем нажатие кнопки
    //await telegram.api.answerCallbackQuery(query.chatInstance);
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