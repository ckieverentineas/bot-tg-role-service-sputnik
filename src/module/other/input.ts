import { InlineKeyboard, InlineKeyboardBuilder } from "puregram";
import { chat_id_moderate, users_pk } from "../..";
import { Accessed, Blank_Cleaner, Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned } from "../helper";
import prisma from "../prisma";
import { Censored_Activation_Pro } from "./censored";
import { User_Pk_Get, User_Pk_Init } from "./pk_metr";
import { Blank } from "@prisma/client";

export async function Input_Module(context: any) {
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    
    if (id == null) { return }
    //await Send_Message(context, `mode: ${users_pk[id].mode}\n operation: ${users_pk[id].operation}\n input: ${users_pk[id].text}`)
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
        'sniper_research_prefab_input_off': Sniper_Research_Prefab_Input_Off // Снайпер - Ввод номера анкеты
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
    //console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
	await Online_Set(context)
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 30) { await Send_Message(context, `Анкету от 30 символов надо!`); return }
    await Logger(`(private chat) ~ starting creation self blank by <user> №${context.senderId}`)
    await Send_Message(context, `⚠ В анкете зарегистрировано ${text_input.length} из ${users_pk[id].text.length} введенных вами символов.`)
    const save = await prisma.blank.create({ data: { text: text_input, id_account: user_check.id } })
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🧲 Настроить теги', payload: { cmd: 'tagator_blank_config' } })
	await Send_Message(context, `🔧 Вы успешно создали анкетку-конфетку под UID: ${save.id}\n${save.text}`, keyboard)
    users_pk[id].operation = ''
    users_pk[id].text = ''
}

async function Blank_Edit_Prefab_Input_Off(context: any, id: number) {
    console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
	await Online_Set(context)
    const datenow: any = new Date()
    const dateold: any = new Date(blank_check.crdate)
	const timeouter = 86400000
    if (datenow-dateold > timeouter) { return await Send_Message(context, `⚠ Анкете больше суток, редактирование запрещено`) }
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 30) { await Send_Message(context, `Анкету от 30 символов надо!`); return }
    await Send_Message(context, `⚠ В анкете зарегистрировано ${text_input.length} из ${users_pk[id].text.length} введенных вами символов.`)
    const blank_edit = await prisma.blank.update({ where: { id: blank_check.id, id_account: user_check.id }, data: { text: text_input } })
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '📃 Моя анкета', payload: { cmd: 'blank_self' } }),
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
      ])
	await Send_Message(context, `✅ Успешно изменено:\n📜 Анкета: ${blank_edit.id}\n💬 Содержание:\n${blank_edit.text}`, keyboard)
    await Logger(`(private chat) ~ finished edit self <blank> #${blank_check.id} by <user> №${context.senderId}`)
    users_pk[id].operation = ''
    users_pk[id].text = ''
}

async function Blank_Report_Prefab_Input_Off(context: any, id: number) {
    //console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
	await Online_Set(context)
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Жалобу от 10 символов надо!`); }
    if (text_input.length > 2000) { return await Send_Message(context, `⚠ Жалобу до 2000 символов надо!`);  }
    if (!users_pk[id].id_target) { return }
    const blank_report_check = await prisma.blank.findFirst({ where: { id: Number(users_pk[id].id_target) } })
    if (!blank_report_check) { return }
    const report_set = await prisma.report.create({ data: { id_blank:  blank_report_check.id, id_account: user_check.id, text: text_input }})
    
	await Logger(`(private chat) ~ report send about <blank> #${blank_report_check.id} by <user> №${context.chat.id}`)

    
    const user_warn = await prisma.account.findFirst({ where: { id: blank_report_check.id_account } })
    const counter_warn = await prisma.report.count({ where: { id_blank: blank_report_check.id, status: 'wait' } })
    if (!user_warn) { return }
    await Send_Message_NotSelf(Number(user_warn.idvk), `✅ На вашу анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
    if (counter_warn >= 3) {
        await prisma.blank.update({ where: { id: blank_report_check.id }, data: { banned: true } })
        await Send_Message_NotSelf(Number(user_warn.idvk), `🚫 На вашу анкету #${blank_report_check.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
        await Send_Message_NotSelf(Number(chat_id_moderate), `⚠ Анкета #${blank_report_check.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
    }
    const blank_report_check_vision = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: blank_report_check.id }})
    if (!blank_report_check_vision) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: blank_report_check.id } }) }
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } }),
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
    ])
    await Send_Message(context, `✅ Мы зарегистрировали вашу жалобу на анкету #${blank_report_check.id}, спасибо за донос!`, keyboard)
    await Send_Message_NotSelf(Number(chat_id_moderate), `🧨 На анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
}

async function Blank_Like_Donation_Prefab_Input_Off(context: any, id: number) {
    //console.log(context)
    // проверям себя и свою анкету
    const user_self = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_self) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_self = await prisma.blank.findFirst({ where: { id_account: user_self.id } })
    if (!blank_self) { return }
	await Online_Set(context)
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 10) { return await Send_Message(context, `⚠ Сообщение от 10 символов надо!`); }
    if (text_input.length > 3000) { return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`);  }
    if (!users_pk[id].id_target) { return }
    const blank_like_don_check = await prisma.blank.findFirst({ where: { id: Number(users_pk[id].id_target) } })
    if (!blank_like_don_check) { return }

    // проверяем наличие понравившегося пользователя и его анкеты
    const blank_nice = await prisma.blank.findFirst({ where: { id: blank_like_don_check.id } })
    if (!blank_nice) { return }
    const user_nice = await prisma.account.findFirst({ where: { id: blank_nice.id_account } })
    if (!user_nice) { return }
    // проверяем анкету на просмотр и в случае чего делаем просмотренной
    const blank_vision_check = await prisma.vision.findFirst({ where: { id_account: context.chat.id, id_blank: blank_like_don_check.id }})
    if (!blank_vision_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_self.id, id_blank: blank_like_don_check.id } }) }
    
    const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
    if (!mail_set) { return }
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
    await Send_Message_NotSelf(Number(user_nice.idvk) , `✉️ Получено приватное письмо от владельца анкеты #${blank_self.id}: ${text_input}\n⚠ Чтобы отреагировать, загляните в почту и найдите анкету #${blank_self.id}.`)
	await Send_Message_NotSelf(Number(chat_id_moderate), `⚖️ #${blank_self.id} --> ${text_input} --> #${blank_nice.id}`)
    await Logger(`(private chat) ~ clicked swipe with private message for <blank> #${blank_like_don_check.id} by <user> №${context.chat.id}`)
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } }),
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
    ])
    await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу вместе с приложением: ${text_input}`, keyboard)
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
}

async function Sniper_Research_Prefab_Input_Off(context: any, id: number) {
    //console.log(context)
    // проверям себя и свою анкету
    const user_self = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_self) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_self = await prisma.blank.findFirst({ where: { id_account: user_self.id } })
    if (!blank_self) { return }
	await Online_Set(context)
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 1) { return await Send_Message(context, `⚠ Сообщение от 1 символов надо!`); }
    if (text_input.length > 3000) { return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`);  }
    
    if (typeof Number(text_input) != "number") { return Send_Message(context, `⚠ Необходимо ввести число!`);}
    const inputer = Math.floor(Number(text_input))
    if (inputer < 0) { return await Send_Message(context, `⚠ Введите положительное число!`); }
    if (Number.isNaN(inputer)) { return await Send_Message(context, `⚠ Не ну реально, ты дурак/дура или как? Число напиши нафиг!`); }

    //if (!users_pk[id].id_target) { return }
    const blank_sniper_check = await prisma.blank.findFirst({ where: { id: inputer, banned: false } })
    const keyboard_end_blank_query = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    if (!blank_sniper_check) { return await Send_Message(context, `⚠ Внимание, анкета не обнаружена!`, keyboard_end_blank_query);}
    const selector: Blank = blank_sniper_check
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `) }
    let censored = user_self.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    const text = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '⛔ Налево', payload: { cmd: 'blank_unlike', idb: selector.id } }),
            InlineKeyboard.textButton({ text: `✅ Направо`, payload: { cmd: 'blank_like', idb: selector.id } })
        ],
        (user_self.donate == true) ?
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
            InlineKeyboard.textButton({ text: '✏ Направо', payload: { cmd: 'blank_like_don', idb: selector.id  } })
        ] :
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ],
        [
            InlineKeyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'blank_report', idb: selector.id } })
        ]
    ])
    await Send_Message(context, `${text}`, keyboard, /*blank.photo*/)
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
}