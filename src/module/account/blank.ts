import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Online_Set, Send_Message, User_Banned, Verify_User } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { getTagById, keyboard_back, Keyboard_Tag_Constructor } from "../datacenter/tag";

export async function Blank_Self(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    const keyboard = new InlineKeyboardBuilder()
    if (blank_check) { 
        // проверка таймстемпа на редактирование анкеты
        const datenow: any = new Date()
        const dateold: any = new Date(blank_check.crdate)
        const timeouter = 86400000
        keyboard.textButton({ text: '⛔ Удалить', payload: { cmd: 'blank_delete' } })
        if (datenow-dateold > timeouter) { keyboard.textButton({ text: '✏ Изменить', payload: { cmd: 'blank_edit_prefab_input_on' } }).row() } else { keyboard.row() }
        keyboard.textButton({ text: '🧲 Настроить теги', payload: { cmd: 'tagator_blank_config' } })
    } else {
        keyboard.textButton({ text: '➕ Создать', payload: { cmd: 'blank_create' } })
    }
    keyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    let answer = ''
	if (!blank_check) {
        await Logger(`(blank config) ~ starting creation self <blank> for @${user_check.username}`)
		answer = `⚠ У вас еще нет анкеты, нажмите [➕ Создать]`
	} else {
		const blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
		if (blank) {
			const count_vision = await prisma.vision.count({ where: { id_blank: blank.id } })
			const count_max_vision = await prisma.blank.count({})
			const count_success = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: true }})
			const count_ignore = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: false }})
			const count_wrong = await prisma.mail.count({ where: { blank_to: blank.id, read: true, find: false }})
			const count_unread = await prisma.mail.count({ where: { blank_to: blank.id, read: false }})
			const counter_warn = await prisma.report.count({ where: { id_blank: blank.id } })
			let censored = user_check.censored ? await Censored_Activation_Pro(blank.text) : blank.text
			answer = `🛰️ Бланковый станок «Бюрократия-6000»\n\n📜 Анкета: ${blank.id}\n💬 Содержание:\n${censored}\n👁 Просмотров: ${count_vision}/${-1+count_max_vision}\n⚠ Предупреждений: ${counter_warn}/3\n✅ Принятых: ${count_success}\n🚫 Игноров: ${count_ignore}\n⌛ Ожидает: ${count_unread}\n❗ Потеряшек: ${count_wrong}`
            await Logger(`(blank config) ~ show self <blank> #${blank.id} for @${user_check.username}`)
		}
	}
    await Send_Message(context, `${answer}`, keyboard)
}

export async function Blank_Create(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести анкету', payload: { cmd: 'blank_create_prefab_input_on' } })
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `📎 Перед вводом анкеты подтвердите готовность, нажав кнопку ✏ Ввести анкету`, keyboard)
    await Logger(`(blank config) ~ init prefab for creation blank for @${user_check.username}`)
}
export async function Tagator_Blank_Config(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    const blank_check = user_verify.blank_check
    // инициализация тегов в базе данных
    if (blank_check.tag == null) { await prisma.blank.update({ where: { id: blank_check.id }, data: { tag: JSON.stringify([]) } })} 
    // парсим теги анкеты для тегатора
    let tag = blank_check.tag != null ? JSON.parse(blank_check.tag ?? []) : []
    // добавляем или удаляем теги в список своей анкеты
    const id_tag = queryPayload.id ? Number(queryPayload.id) : null
    const tag_sel = queryPayload.id && id_tag ? await getTagById(id_tag) : null
    if (tag_sel) { 
        if (tag.includes(id_tag)) {
            tag = tag.filter((selectedId: any) => selectedId !== id_tag);
        } else {
            tag = [...tag, id_tag];
        }
        await prisma.blank.update({ where: { id: blank_check.id }, data: { tag: JSON.stringify(tag) } })
    }
    let tags = ''
    for (const i of tag) {
        //console.log(i)
        tags += `${await getTagById(i)} `
    }
    //await Send_Message(context, `Вы выбрали следующие теги: ${tags}`)
    const keyboard = await Keyboard_Tag_Constructor(tag, 'tagator_blank_config', 'main_menu')
    await Send_Message(context, `📎 Настройте теги своей анкеты (для тегатора)`, keyboard)
    await Logger(`(blank tagator config) ~ select favorite tag ${tag_sel} by @${user_check.username}`)
}
export async function Blank_Create_Prefab_Input_ON(context: MessageContext) {
    if (!context.chat.username) {
        return await Send_Message(context, 'Установите username в настройках профиля своего аккаунта Telegram')
    }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_create_prefab_input_off'
    await Send_Message(context, `📎 Введите анкету от 30 до 4000 символов:`)
    await Logger(`(blank config) ~ activation prefab input text for blank by @${user_check.username}`)
}

export async function Blank_Edit_Prefab_Input_ON(context: MessageContext) {
    if (!context.chat.username) {
        return await Send_Message(context, 'Установите username в настройках профиля своего аккаунта Telegram')
    }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_edit_prefab_input_off'
    await Send_Message(context, `📎 Введите измененную анкету от 30 до 4000 символов:`, /*blank.photo*/)
    await Logger(`(blank config) ~ starting input text for blank by @${user_check.username}`)
}
export async function Blank_Delete(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    const blank_delete = await prisma.blank.delete({ where: { id: blank_check.id } })
    if (blank_delete) { 
        await Send_Message(context, `✅ Успешно удалено:\n📜 Анкета: ${blank_delete.id}\n💬 Содержание:\n${blank_delete.text}`, keyboard_back)
        await Logger(`(blank config) ~ deleted self <blank> #${blank_delete.id} for @${user_check.username}`)
    }
}

export async function Censored_Change(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @vasochka_s_konfetami для разбана`) }
	await Online_Set(context)
	const censored_change = await prisma.account.update({ where: { id: user_check.id }, data: { censored: user_check.censored ? false : true } })
    if (censored_change) { 
        const keyboard = new InlineKeyboardBuilder()
        .textButton({ text: '✅ В меню', payload: { cmd: 'main_menu' } })
        await Send_Message(context, `🔧 Цензура ${censored_change.censored ? 'активирована' : 'отключена'}`, keyboard)
        await Logger(`(profile config) ~ changed status activity censored self for @${user_check.username}`)
    }
}