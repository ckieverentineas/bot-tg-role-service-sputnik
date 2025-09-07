import { InlineKeyboard, InlineKeyboardBuilder } from "puregram";
import { chat_id_moderate, users_pk } from "../..";
import { Accessed, Blank_Cleaner, Blank_Vision_Activity, Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned, Username_Verify, Verify_Blank_Not_Self, Verify_User, Format_Text_With_Tags } from "../helper";
import prisma from "../prisma";
import { Censored_Activation_Pro } from "./censored";
import { User_Pk_Get, User_Pk_Init } from "./pk_metr";
import { Blank } from "@prisma/client";
import { keyboard_back, getTagsForBlank } from "../datacenter/tag";
import { Browser_Research_Prefab_Input_Off, Browser_Report_Prefab_Input_Off, Browser_Like_Donation_Prefab_Input_Off} from "../reseacher/browser";

export async function Input_Module(context: any) {
    // подготовка хранилища для модуля ввода пользователем
    await User_Pk_Init(context)
    // идентификация хранилища пользователя
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    //await Send_Message(context, `mode: ${users_pk[id].mode}\n operation: ${users_pk[id].operation}\n input: ${users_pk[id].text}`)
    // проверка на режим ввода
	if (context.text && typeof context.text == `string` && users_pk[id].mode == 'input') {
		users_pk[id].text = context.text
        users_pk[id].mode = 'main'
        //await Send_Message(context, `мод: ${users_pk[id].operation}\n текст: ${users_pk[id].text}`)
	} else {
        return false
    }
    const config: Record<string, Function> = {
        "blank_create_prefab_input_off": Blank_Create_Prefab_Input_Off, // 1 Анкета - Сохранение анкеты
        'blank_edit_prefab_input_off': Blank_Edit_Prefab_Input_Off, // 1 Анкета - Изменение анкеты
        "blank_report_prefab_input_off": Blank_Report_Prefab_Input_Off, // 2 Рандом - жалоба на анкету
        'blank_like_donation_prefab_input_off': Blank_Like_Donation_Prefab_Input_Off, // Рандом - лайк донатера с сообщением пользователю
        'sniper_research_prefab_input_off': Sniper_Research_Prefab_Input_Off, // Снайпер - Ввод номера анкеты
        'tagator_report_prefab_input_off': Tagator_Report_Prefab_Input_Off,
        'tagator_like_donation_prefab_input_off': Tagator_Like_Donation_Prefab_Input_Off,
        "browser_research_prefab_input_off": Browser_Research_Prefab_Input_Off,
        "browser_report_prefab_input_off": Browser_Report_Prefab_Input_Off,
        "browser_like_donation_prefab_input_off": Browser_Like_Donation_Prefab_Input_Off
    };
    const command: string | any = users_pk[id].operation;
    if (typeof command != 'string') { return }
    if (config.hasOwnProperty(command)) {
        try {
            await config[command](context, id);
            //await message.editMessageReplyMarkup({ inline_keyboard: [] });
        } catch (e) {
            await Logger(`Error event detected for command '${command}': ${e}`);
        }
    } else {
        await Logger(`Unknown command: '${command}'`);
    }
    return true
	//console.log(users_pk[id].text)
}

async function Blank_Create_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { 
        await Send_Message(context, `💔 Ваш аккаунт не зарегистрирован, напишите начать.`)
        return false 
    }
    const banned_me = await User_Banned(context)
    if (banned_me) { 
        await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`, keyboard_back) 
        return false
    }
    await Online_Set(context)
    await Username_Verify(context)
    //const blank_check = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести анкету повторно', payload: { cmd: 'blank_create_prefab_input_on' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    // верификация анкеты
    if (text_input.length < 30) { return await Send_Message(context, `⚠ Анкету от 30 символов надо!`, keyboard_repeat) }
    if (text_input.length > 4000) { return await Send_Message(context, `⚠ Анкету до 4000 символов надо!`, keyboard_repeat) }
    await Send_Message(context, `⚠ В анкете зарегистрировано ${text_input.length} из ${users_pk[id].text.length} введенных вами символов.`)
    // сохранение анкеты
    const save = await prisma.blank.create({ data: { text: text_input, id_account: user_check.id } })
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🧲 Настроить теги', payload: { cmd: 'tagator_blank_config' } })
	await Send_Message(context, `🔧 Вы успешно создали анкетку-конфетку под UID: ${save.id}\n${save.text}`, keyboard)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    await Logger(`(blank config) ~ created <blank> #${save.id} for @${user_check.username}`)
}

async function Blank_Edit_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    const blank_check = user_verify.blank_check
    // проверка таймстемпа на редактирование анкеты
    const datenow: any = new Date()
    const dateold: any = new Date(blank_check.crdate)
	const timeouter = 86400000
    if (datenow-dateold > timeouter) { return await Send_Message(context, `⚠ Анкете больше суток, редактирование запрещено`, keyboard_back ) }
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Изменить анкету повторно', payload: { cmd: 'blank_edit_prefab_input_on' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    // верификация анкеты
    if (text_input.length < 30) { return await Send_Message(context, `⚠ Анкету от 30 символов надо!`, keyboard_repeat) }
    if (text_input.length > 4000) { return await Send_Message(context, `⚠ Анкету до 4000 символов надо!`, keyboard_repeat) }
    await Send_Message(context, `⚠ В анкете зарегистрировано ${text_input.length} из ${users_pk[id].text.length} введенных вами символов.`)
    // сохранение измененой анкеты
    const blank_edit = await prisma.blank.update({ where: { id: blank_check.id, id_account: user_check.id }, data: { text: text_input } })
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '📃 Моя анкета', payload: { cmd: 'blank_self' } })
    .textButton({ text: '🧲 Настроить теги', payload: { cmd: 'tagator_blank_config' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
	await Send_Message(context, `✅ Успешно изменено:\n📜 Анкета: ${blank_edit.id}\n💬 Содержание:\n${blank_edit.text}`, keyboard)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    await Logger(`(blank config) ~ edit self <blank> #${blank_edit.id} for @${user_check.username}`)
}

async function Blank_Report_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    //const blank_check = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'blank_report_ION', idb: Number(users_pk[id].id_target) } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'random_research' } })
    // верификация репорта
    if (!users_pk[id].id_target) { return await Send_Message(context, `⚠ Анкета не выбрана для подачи жалобы`, keyboard_back); }
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Жалобу от 10 символов надо!`, keyboard_repeat); }
    if (text_input.length > 2000) { return await Send_Message(context, `⚠ Жалобу до 2000 символов надо!`, keyboard_repeat);  }
    // проверяем наличие пользователя и его анкеты для жалобы
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) { return }
    const user_warn = blank_verify.user_nice
    const blank_report_check = blank_verify.blank_nice
    // сохранение репорта и уведомления
    const report_set = await prisma.report.create({ data: { id_blank:  blank_report_check.id, id_account: user_check.id, text: text_input }})
    const counter_warn = await prisma.report.count({ where: { id_blank: blank_report_check.id, status: 'wait' } })
    await Send_Message_NotSelf(Number(user_warn.idvk), `✅ На вашу анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
    if (counter_warn >= 3) {
        await prisma.blank.update({ where: { id: blank_report_check.id }, data: { banned: true } })
        await Send_Message_NotSelf(Number(user_warn.idvk), `🚫 На вашу анкету #${blank_report_check.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
        await Send_Message_NotSelf(Number(chat_id_moderate), `⚠ Анкета #${blank_report_check.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
    }
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, blank_report_check.id, user_check)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `✅ Мы зарегистрировали вашу жалобу на анкету #${blank_report_check.id}, спасибо за донос!`, keyboard)
    await Send_Message_NotSelf(Number(chat_id_moderate), `🧨 На анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(random researcher) ~ report on <blank> #${blank_report_check.id} by @${user_check.username}`)
}

async function Tagator_Report_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    //const blank_check = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'tagator_report_ION', idb: Number(users_pk[id].id_target) } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'tagator_research' } })
    // верификация репорта
    if (!users_pk[id].id_target) { return await Send_Message(context, `⚠ Анкета не выбрана для подачи жалобы`, keyboard_back); }
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Жалобу от 10 символов надо!`, keyboard_repeat); }
    if (text_input.length > 2000) { return await Send_Message(context, `⚠ Жалобу до 2000 символов надо!`, keyboard_repeat);  }
    // проверяем наличие пользователя и его анкеты для жалобы
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) { return }
    const user_warn = blank_verify.user_nice
    const blank_report_check = blank_verify.blank_nice
    // сохранение репорта и уведомления
    const report_set = await prisma.report.create({ data: { id_blank:  blank_report_check.id, id_account: user_check.id, text: text_input }})
    const counter_warn = await prisma.report.count({ where: { id_blank: blank_report_check.id, status: 'wait' } })
    await Send_Message_NotSelf(Number(user_warn.idvk), `✅ На вашу анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
    if (counter_warn >= 3) {
        await prisma.blank.update({ where: { id: blank_report_check.id }, data: { banned: true } })
        await Send_Message_NotSelf(Number(user_warn.idvk), `🚫 На вашу анкету #${blank_report_check.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
        await Send_Message_NotSelf(Number(chat_id_moderate), `⚠ Анкета #${blank_report_check.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
    }
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, blank_report_check.id, user_check)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '🌐 Тегатор', payload: { cmd: 'tagator_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `✅ Мы зарегистрировали вашу жалобу на анкету #${blank_report_check.id}, спасибо за донос!`, keyboard)
    await Send_Message_NotSelf(Number(chat_id_moderate), `🧨 На анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(tagator researcher) ~ report on <blank> #${blank_report_check.id} by @${user_check.username}`)
}

async function Blank_Like_Donation_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Письмо повторно', payload: { cmd: 'blank_like_don', idb: Number(users_pk[id].id_target) } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'random_research' } })
    // верификация репорта
    if (!users_pk[id].id_target) { return await Send_Message(context, `⚠ Анкета не выбрана для жирного лайка`, keyboard_back); }
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Сообщение от 10 символов надо!`, keyboard_repeat); }
    if (text_input.length > 3000) { return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`, keyboard_repeat);  }
    // проверяем наличие пользователя и его анкеты для жалобы
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) { return }
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, blank_nice.id, user_self)
    // сохранение сообщения в почту и уведомления
    const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
    await Send_Message_NotSelf(Number(user_nice.idvk) , `✉️ Получено приватное письмо от владельца анкеты #${blank_self.id}: ${text_input}\n⚠ Чтобы отреагировать, загляните в почту и найдите анкету #${blank_self.id}.`)
	await Send_Message_NotSelf(Number(chat_id_moderate), `⚖️ #${blank_self.id} --> ${text_input} --> #${blank_nice.id}`)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу вместе с приложением: ${text_input}`, keyboard)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(random researcher) ~ swipe like with message for <blank> #${blank_nice.id} by @${user_self.username}`)
}

async function Tagator_Like_Donation_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Письмо повторно', payload: { cmd: 'tagator_like_don', idb: Number(users_pk[id].id_target) } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'tagator_research' } })
    // верификация репорта
    if (!users_pk[id].id_target) { return await Send_Message(context, `⚠ Анкета не выбрана для жирного лайка`, keyboard_back); }
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Сообщение от 10 символов надо!`, keyboard_repeat); }
    if (text_input.length > 3000) { return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`, keyboard_repeat);  }
    // проверяем наличие пользователя и его анкеты для жалобы
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) { return }
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, blank_nice.id, user_self)
    // сохранение сообщения в почту и уведомления
    const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
    await Send_Message_NotSelf(Number(user_nice.idvk) , `✉️ Получено приватное письмо от владельца анкеты #${blank_self.id}: ${text_input}\n⚠ Чтобы отреагировать, загляните в почту и найдите анкету #${blank_self.id}.`)
	await Send_Message_NotSelf(Number(chat_id_moderate), `⚖️ #${blank_self.id} --> ${text_input} --> #${blank_nice.id}`)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '🌐 Тегатор', payload: { cmd: 'tagator_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу вместе с приложением: ${text_input}`, keyboard)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(tagator researcher) ~ swipe like with message for <blank> #${blank_nice.id} by @${user_self.username}`)
}

async function Sniper_Research_Prefab_Input_Off(context: any, id: number) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // чистка пользовательского ввода от запрещенных символов
    let text_input = await Blank_Cleaner(users_pk[id].text)
    // верификация введеного пользователем номера анкеты
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: `🎯 Снайпер`, payload: { cmd: 'sniper_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    if (text_input.length < 1) { return await Send_Message(context, `⚠ Сообщение от 1 символа надо!`, keyboard_repeat); }
    if (text_input.length > 3000) { return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`, keyboard_repeat);  }
    if (typeof Number(text_input) != "number") { return Send_Message(context, `⚠ Необходимо ввести число!`, keyboard_repeat);}
    const inputer = Math.floor(Number(text_input))
    if (inputer < 0) { return await Send_Message(context, `⚠ Введите положительное число!`, keyboard_repeat); }
    if (Number.isNaN(inputer)) { return await Send_Message(context, `⚠ Не ну реально, ты дурак/дура или как? Число напиши нафиг!`, keyboard_repeat); }
    //if (!users_pk[id].id_target) { return }
    // проверка заснайперенной анкеты
    const blank_sniper_check = await prisma.blank.findFirst({ where: { id: inputer, banned: false } })
    if (!blank_sniper_check) { return await Send_Message(context, `⚠ Внимание, анкета не обнаружена!`, keyboard_back);}
    const selector: Blank = blank_sniper_check
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `, keyboard_back) }
    let censored = user_self.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    
    // Используем новую систему форматирования с тегами
    const baseText = `🛰️ Поисковый режим «Снайпер-0000»:\n\n📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const tags = await getTagsForBlank(selector.id)
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, selector.id, tags)
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'blank_unlike', idb: selector.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'blank_like', idb: selector.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'sniper_research' } })
    
    if (user_self.donate == true) {
        keyboard.textButton({ text: '✏ Письмо', payload: { cmd: 'blank_like_don', idb: selector.id  } })
    } else {
        keyboard.row()
    }
    
    keyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'blank_report', idb: selector.id } })
    
    await Send_Message(context, `${text}`, keyboard)
    // очистка промежуточных данных
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(sniper researcher) ~ show <blank> #${blank_check_notself.id} for @${user_self.username}`)
}