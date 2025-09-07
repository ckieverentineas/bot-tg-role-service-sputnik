import * as dotenv from 'dotenv';
import { Keyboard, KeyboardBuilder, Telegram, InlineKeyboardBuilder } from 'puregram';

const { QuestionManager } = require('puregram-question');


import prisma from './module/prisma';
import { Denied_Processing_Of_Personal_Data, Success_Processing_Of_Personal_Data, User_Registration } from './module/account/registration';
import { CallbackQueryContext, InlineKeyboard, MessageContext } from 'puregram';
import { HearManager } from '@puregram/hear';
import { commandUserRoutes } from './command';
import { Blank_Inactivity, Logger, Online_Set, Send_Message, Sleep, Worker_Checker } from './module/helper';
import { Exit_Menu, Main_Menu } from './module/menu/main';
import { Blank_Create, Blank_Create_Prefab_Input_ON, Blank_Delete, Blank_Edit_Prefab_Input_ON, Blank_Self, Censored_Change, Tagator_Blank_Config, Tag_Display_Settings } from './module/account/blank';
import { Counter_PK_Module } from './module/other/pk_metr';
import { Input_Module } from './module/other/input';
import { Blank_Like, Blank_Like_Donation_Perfab_Input_ON, Blank_Report, Blank_Report_Perfab_Input_ON, Blank_Unlike, Random_Research, Show_Tags, Random_Research_Show_Blank } from './module/reseacher/random';
import { Mail_Like, Mail_Self, Mail_Unlike } from './module/account/mail';
import { Moderate_Denied, Moderate_Self, Moderate_Success } from './module/account/moderate';
import { UnBanHammer } from './module/account/banhammer';
import { Archive_Like, Archive_Research, Archive_Unlike, Show_Tags_Archive, Archive_Research_Show_Blank } from './module/reseacher/archive';
import { List_Admin, List_Ban, List_Banhammer, List_Donate } from './module/account/statistics';
import { Sniper_Research_Perfab_Input_ON, Show_Tags_Sniper, Sniper_Research_Show_Blank } from './module/reseacher/sniper';
import { Tagator_Like, Tagator_Like_Donation_Perfab_Input_ON, Tagator_Menu, Tagator_Report, Tagator_Report_Perfab_Input_ON, Tagator_Research, Tagator_Research_Config_Like, Tagator_Research_Config_Reset, Tagator_Research_Config_Unlike, Tagator_Unlike, Show_Tags_Tagator, Tagator_Research_Show_Blank } from './module/reseacher/tagator';
import { Bot } from './module/ai/speak';
import { Browser_Research, Browser_Like, Browser_Unlike, Browser_Report, Browser_Report_Perfab_Input_ON, Browser_Like_Donation_Perfab_Input_ON, Show_Tags_Browser, Browser_Research_Show_Blank } from "./module/reseacher/browser";

dotenv.config();

// Загрузка из .env, задание параметров
const token: any = process.env.TOKEN;
export const root = process.env.ROOT;
export const chat_id_system = process.env.chat_id_system;
export const chat_id_moderate = process.env.chat_id_moderate;
export const telegram = Telegram.fromToken(token)
export const starting_date = new Date(); // запись времени работы бота
const questionManager = new QuestionManager();
//telegram.updates.use(questionManager.middleware);
const hearManager = new HearManager()
telegram.updates.on('message', hearManager.middleware)
commandUserRoutes(hearManager)
const bot = new Bot();

// хранилище для пкметра и режимов
export const users_pk: Array<{ 
    idvk: number, 
    text: string, 
    mode: 'main' | 'pkmetr' | 'input', 
    operation: string, 
    id_target: number | null, 
    searchResults?: any[], 
    searchQuery?: string, 
    currentIndex?: number 
}> = []

async function checkSubscription(userId: number): Promise<boolean> {
  try {
    const member = await telegram.api.getChatMember({
      chat_id: '@sputnik_signal',
      user_id: userId
    })

    return member.status !== 'left' && member.status !== 'kicked'
  } catch (error) {
    console.error(`Ошибка при проверке подписки:`, error)
    return false
  }
}

telegram.updates.on('message', async (context: MessageContext) => {
    //console.log(context)
    if (context.chat.id < 0) { return }
    // Проверяем, является ли сообщение текстовым
    
    
	//await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест2`, attachment: `photo200840769_457273112` } )
	//Модуль вызова пкметра
	const pk_counter_st = await Counter_PK_Module(context)
	//console.log(users_pk)
	if (pk_counter_st) { return }
    const input_st = await Input_Module(context)
	//console.log(users_pk)
	if (input_st) { return }
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.account.findFirst({ where: { idvk: context.chat?.id } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) { await User_Registration(context); return }
    
    if (context.chat.id > 0) {
        const user = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
        if (context.chat.username != user?.username) {
            const save = await prisma.account.update({	where: { id: user!.id }, data: { username: context.chat?.username } })
            await Send_Message(context, `Ваш юзернейм изменился с ${user?.username} на ${save?.username}`)
        }
    }
	await Online_Set(context)
    /*
    await bot.addMessage(context.text || 'zero');
    const ans = await bot.generateResponse(10);
    await Send_Message(context,`${ans}`)*/
	return;
});

// Обработка нажатий на инлайн-кнопки
telegram.updates.on('callback_query', async (query: CallbackQueryContext) => {
    const { message }= query;
    const queryPayload: any = query.queryPayload

    if (!message || !message.from) {
        return; // Игнорируем, если сообщение или чат отсутствуют
    }
    const config: Record<string, Function> = {
        "success_processing_of_personal_data": Success_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Принятие
        "denied_processing_of_personal_data": Denied_Processing_Of_Personal_Data, // 1 Регистрация аккаунта - Отклонение

        'main_menu': Main_Menu, // 0 Меню - системное
        'tagator_menu': Tagator_Menu, // 0 Меню - поисковое меню для тегатора-3000
        'unbanhammer': UnBanHammer, // Банхаммер - амнистия

        'blank_self': Blank_Self, // 2 Анкета - Главное меню
        'blank_create': Blank_Create, // 2 Анкета - Подтверждение создания анкеты пользователем
        'blank_create_prefab_input_on': Blank_Create_Prefab_Input_ON, // 2 Анкета - активация режима ввода анкеты пользователем
        'blank_delete': Blank_Delete, // 2 Анкета - Удаление анкеты пользователем,
        'blank_edit_prefab_input_on': Blank_Edit_Prefab_Input_ON, // 2 Анкета - Изменение анкеты пользователем
        'tag_display_settings': Tag_Display_Settings, // 2 Анкета - Настройки отображения тегов

        'show_tags': Show_Tags,
        'show_tags_sniper': Show_Tags_Sniper,
        'random_research_show_blank': Random_Research_Show_Blank, // Показ конкретной анкеты в рандоме
        'sniper_research_show_blank': Sniper_Research_Show_Blank,
        'show_tags_tagator': Show_Tags_Tagator,
        'tagator_research_show_blank': Tagator_Research_Show_Blank,
        'show_tags_archive': Show_Tags_Archive,
        'archive_research_show_blank': Archive_Research_Show_Blank,
        'random_research': Random_Research, // 3 Поиск - Случайный рандом входная точка
        'blank_like': Blank_Like, // 3 Поиск - Случайный рандом лайкаем анкетку конфетку,
        'blank_like_don': Blank_Like_Donation_Perfab_Input_ON, // 3 Поиск - Случайный донатерский рандом лайкаем анкету с приложением письма.
        'blank_unlike': Blank_Unlike, // 3 Поиск - Случайный рандом дизлайкаем анкетку конфетку
        'blank_report': Blank_Report, // 3 Поиск - Подтверждение ввода жалобы
        'blank_report_ION': Blank_Report_Perfab_Input_ON, // 3 Поиск - активация режима ввода жалобы
        'censored_change': Censored_Change, // 3 Поиск - Активация/Реактивация цензуры

        'archive_research': Archive_Research, // 3 Поиск - Случайный рандом по уже просмотренным анкетам входная точка
        'archive_like': Archive_Like, // 3 Поиск - Случайный рандом анти лайкаем анкетку конфетку,
        'archive_unlike': Archive_Unlike, // 3 Поиск - Случайный рандом анти дизлайкаем анкетку конфетку

        'mail_self': Mail_Self, // 4 Почта - Главное меню
        'mail_like': Mail_Like, // 4 Почта - Лайкаем анкету в почте,
        'mail_unlike': Mail_Unlike, // 4 Почта - Дизлайкаем анкету в почте

        'moderate_self': Moderate_Self, // 5 Модерация - Главное меню
        'moderate_success': Moderate_Success, // 5 Модерация - Одобрение жалоб
        'moderate_denied': Moderate_Denied, // 5 Модерация - Отклонение жалоб

        'list_admin': List_Admin, // 6 Статистика - Список администраторов
        'list_donate': List_Donate, // 6 Статистика - Список донатеров
        'list_ban': List_Ban, // 6 Статистика - Список забаненных
        'list_banhammer': List_Banhammer, // 6 Статистика - Список пользователей в черном списке пользователя

        'sniper_research': Sniper_Research_Perfab_Input_ON, // 3 Поиск - Режим Снайпера, ввод ид анкеты

        'tagator_blank_config': Tagator_Blank_Config, // 7 Тегатор - настройка тегов для анкеты
        'tagator_research_config_like': Tagator_Research_Config_Like, // 7 Тегатор - настройка тегов для поиска нужных анкет
        'tagator_research_config_unlike': Tagator_Research_Config_Unlike, // 7 Тегатор - настройка тегов для исключения из поиска ненужных анкет
        'tagator_research_config_reset': Tagator_Research_Config_Reset, // 7 Тегатор - сброс фаворитных тегов
        'tagator_research': Tagator_Research, // 7 Тегатор - подбор анкет
        'tagator_like': Tagator_Like, // 7 Тегатор - лайк анкеты
        'tagator_unlike': Tagator_Unlike, // 7 Тегатор - дизлайк анкеты
        'tagator_report_ION': Tagator_Report_Perfab_Input_ON,
        'tagator_report': Tagator_Report,
        'tagator_like_don': Tagator_Like_Donation_Perfab_Input_ON,
        'exit_menu': Exit_Menu,

        'browser_research': Browser_Research,
        'browser_like': Browser_Like,
        'browser_unlike': Browser_Unlike,
        'browser_report': Browser_Report,
        'browser_report_ION': Browser_Report_Perfab_Input_ON,
        'browser_like_don': Browser_Like_Donation_Perfab_Input_ON,
        'show_tags_browser': Show_Tags_Browser,
        'browser_research_show_blank': Browser_Research_Show_Blank,
        'check_subscription_browser': async (context: any) => {
            const isSubscribed = await checkSubscription(context.chat.id)
            
            if (isSubscribed) {
                const keyboard = new InlineKeyboardBuilder()
                    .textButton({ text: '🧭 Запустить браузер', payload: { cmd: 'browser_research' } }).row()
                    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
                
                await Send_Message(context, `✅ Отлично! Вы подписаны на наш канал. Теперь можете использовать браузер.`, keyboard)
            } else {
                const keyboard = new InlineKeyboardBuilder()
                    .urlButton({ text: '📢 Подписаться', url: 'https://t.me/sputnik_signal' })
                    .textButton({ text: '🔄 Проверить подписку', payload: { cmd: 'check_subscription_browser' } })
                
                await Send_Message(context, `❌ Вы все еще не подписаны на наш канал @sputnik_signal. Подпишитесь и попробуйте снова.`, keyboard)
            }
        }
    };
    //console.log(query)
    const command: string | any = queryPayload.cmd;
    if (typeof command != 'string') { return }
    
    if (config.hasOwnProperty(command)) {
        try {
            await config[command](message, queryPayload);
            await message.editMessageReplyMarkup({ inline_keyboard: [] });
        } catch (e) {
            await Logger(`Error event detected for command '${command}': ${e}`);
        }
    } else {
        await Logger(`Unknown command: '${command}'`);
    }
    // Подтверждаем нажатие кнопки
    //await telegram.api.answerCallbackQuery(query.chatInstance);
});

const commands = [
    { command: '/start', description: 'registration in system' },
    { command: '/sputnik', description: 'main menu' },
    { command: '/help', description: 'help menu' },
    { command: '/pkmetr', description: 'pkmetr menu' },
    { command: '/keyboard', description: 'get call buttons' },
    { command: '/browser', description: 'browser search' },
];

try {
    telegram.api.setMyCommands({ commands: commands, language_code: 'ru' } );
    Logger('Команды успешно установлены на русском языке');
} catch (error) {
    console.error('Ошибка при установке команд:', error);
}
// Запускаем сервер Telegram
telegram.updates.startPolling().then(async () => {
    await Logger(`@${telegram.bot.username} started polling`)
})

//запускаем раз в сутки выдачу времени
setInterval(Worker_Checker, 86400000);
setInterval(Blank_Inactivity, 86400000);
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