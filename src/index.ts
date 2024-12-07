
import * as dotenv from 'dotenv';
import { Telegram } from 'puregram';

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
import { Blank_Like, Blank_Report, Blank_Report_Perfab_Input_ON, Blank_Unlike, Random_Research } from './module/reseacher/random';
import { Mail_Like, Mail_Self, Mail_Unlike } from './module/account/mail';
import { Moderate_Denied, Moderate_Self, Moderate_Success } from './module/account/moderate';


dotenv.config();

// Загрузка из .env, задание параметров
const token: any = process.env.TOKEN;
export const telegram = Telegram.fromToken(token)
const questionManager = new QuestionManager();
//telegram.updates.use(questionManager.middleware);
const hearManager = new HearManager()
telegram.updates.on('message', hearManager.middleware)
commandUserRoutes(hearManager)

// хранилище для пкметра и режимов
export const users_pk: Array<{ idvk: number, text: string, mode: 'main' | 'pkmetr' | 'input', operation: string, id_target: number | null }> = []

telegram.updates.on('message', async (context: MessageContext) => {
    // Проверяем, является ли сообщение текстовым
    console.log(context)
    
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
    const user = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    const save = await prisma.account.update({	where: { id: user!.id }, data: { username: context.from?.username } })
	//await Online_Set(context)
	//await Keyboard_Index(context, `⌛ Загрузка, пожалуйста подождите...`)
	return;
});

// Обработка нажатий на инлайн-кнопки
telegram.updates.on('callback_query', async (query: CallbackQueryContext) => {
    
    //console.log(context)
    const { message }= query;
    const queryPayload: any = query.queryPayload

    if (!message || !message.from) {
        return; // Игнорируем, если сообщение или чат отсутствуют
    }
    
    const config: Record<string, Function> = {
        "success_processing_of_personal_data": Success_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Принятие
        "denied_processing_of_personal_data": Denied_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Отклонение

        'main_menu': Main_Menu, // 0 Меню - системное
        'sub_menu': Sub_Menu, // 0 Подменю - дополнительное

        'blank_self': Blank_Self, // 2 Анкета - Главное меню
        'blank_create': Blank_Create, // 2 Анкета - Подтверждение создания анкеты пользователем
        'blank_create_prefab_input_on': Blank_Create_Prefab_Input_ON, // 2 Анкета - активация режима ввода анкеты пользователем
        'blank_delete': Blank_Delete, // 2 Анкета - Удаление анкеты пользователем

        'random_research': Random_Research, // 3 Поиск - Случайный рандом входная точка
        'blank_like': Blank_Like, // 3 Поиск - Случайный рандом лайкаем анкетку конфетку,
        'blank_unlike': Blank_Unlike, // 3 Поиск - Случайный рандом дизлайкаем анкетку конфетку
        'blank_report': Blank_Report, // 3 Поиск - Подтверждение ввода жалобы
        'blank_report_ION': Blank_Report_Perfab_Input_ON, // 3 Поиск - активация режима ввода жалобы

        'mail_self': Mail_Self, // 4 Почта - Главное меню
        'mail_like': Mail_Like, // 4 Почта - Лайкаем анкету в почте,
        'mail_unlike': Mail_Unlike, // 4 Почта - Дизлайкаем анкету в почте

        'moderate_self': Moderate_Self, // 5 Модерация - Главное меню
        'moderate_success': Moderate_Success, // 5 Модерация - Одобрение жалоб
        'moderate_denied': Moderate_Denied, // 5 Модерация - Отклонение жалоб
    };
    //console.log(query)
    const command: string | any = queryPayload.cmd;
    if (typeof command != 'string') { return }
    
    if (config.hasOwnProperty(command)) {
        try {
            await config[command](message, queryPayload);
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