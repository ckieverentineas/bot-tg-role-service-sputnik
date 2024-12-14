import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Online_Set, Send_Message, User_Banned } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { getTagById } from "../datacenter/tag";

export async function Blank_Self(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    const keyboard = new InlineKeyboardBuilder()
    if (blank_check) { 
        keyboard.textButton({ text: '⛔ Удалить', payload: { cmd: 'blank_delete' } })
        .textButton({ text: '✏ Изменить', payload: { cmd: 'blank_edit_prefab_input_on' } }).row()
        .textButton({ text: '🧲 Настроить теги', payload: { cmd: 'tagator_blank_config' } })
    } else {
        keyboard.textButton({ text: '➕ Создать', payload: { cmd: 'blank_create' } })
    }
    keyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    let answer = ''
	if (!blank_check) {
		await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
		answer = `⚠ У вас еще нет анкеты, нажмите Создать нафиг`
	} else {
		const blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
		await Logger(`(private chat) ~ starting self blank is viewed by <user> №${context.chat.id}`)
		if (blank) {
			const count_vision = await prisma.vision.count({ where: { id_blank: blank.id } })
			const count_max_vision = await prisma.blank.count({})
			const count_success = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: true }})
			const count_ignore = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: false }})
			const count_wrong = await prisma.mail.count({ where: { blank_to: blank.id, read: true, find: false }})
			const count_unread = await prisma.mail.count({ where: { blank_to: blank.id, read: false }})
			const counter_warn = await prisma.report.count({ where: { id_blank: blank.id } })
			let censored = user_check.censored ? await Censored_Activation_Pro(blank.text) : blank.text
			answer = `📜 Анкета: ${blank.id}\n💬 Содержание:\n${censored}\n👁 Просмотров: ${count_vision}/${-1+count_max_vision}\n⚠ Предупреждений: ${counter_warn}/3\n✅ Принятых: ${count_success}\n🚫 Игноров: ${count_ignore}\n⌛ Ожидает: ${count_unread}\n❗ Потеряшек: ${count_wrong}`
		}
	}
    await Send_Message(context, `${answer}`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Blank_Create(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '✏ Ввести анкету', payload: { cmd: 'blank_create_prefab_input_on' } })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
    ])
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Перед вводом анкеты подтвердите готовность нажав кнопку Ввести анкету`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}
export async function Tagator_Blank_Config(context: MessageContext, queryPayload: any) {
    //console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    if (blank_check.tag == null) { await prisma.blank.update({ where: { id: blank_check.id }, data: { tag: JSON.stringify([]) } })} 
    let tag = blank_check.tag != null ? JSON.parse(blank_check.tag ?? []) : []
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
        console.log(i)
        tags += `${await getTagById(i)} `
    }
    await Send_Message(context, `Вы выбрали следующие теги нафиг: ${tags}`)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '#фандом', payload: { cmd: 'tagator_blank_config', id: 1 } })
    .textButton({ text: '#ориджинал', payload: { cmd: 'tagator_blank_config', id: 2 } }).row()

    .textButton({ text: '#научная_фантастика', payload: { cmd: 'tagator_blank_config', id: 3 } })
    .textButton({ text: '#фантастика', payload: { cmd: 'tagator_blank_config', id: 4 } }).row()
    .textButton({ text: '#фэнтези', payload: { cmd: 'tagator_blank_config', id: 5 } })
    .textButton({ text: '#приключения', payload: { cmd: 'tagator_blank_config', id: 6} })
    .textButton({ text: '#военное', payload: { cmd: 'tagator_blank_config', id: 7 } }).row()
    .textButton({ text: '#историческое', payload: { cmd: 'tagator_blank_config', id: 8 } })
    .textButton({ text: '#детектив', payload: { cmd: 'tagator_blank_config', id: 9 } })
    .textButton({ text: '#криминал', payload: { cmd: 'tagator_blank_config', id: 10 } }).row()
    .textButton({ text: '#экшен', payload: { cmd: 'tagator_blank_config', id: 11 } })
    .textButton({ text: '#ужасы', payload: { cmd: 'tagator_blank_config', id: 12 } })
    .textButton({ text: '#драма', payload: { cmd: 'tagator_blank_config', id: 13 } })
    .textButton({ text: '#мистика', payload: { cmd: 'tagator_blank_config', id: 14 } }).row()
    .textButton({ text: '#психология', payload: { cmd: 'tagator_blank_config', id: 15 } })
    .textButton({ text: '#повседневность', payload: { cmd: 'tagator_blank_config', id: 16 } }).row()
    .textButton({ text: '#романтика', payload: { cmd: 'tagator_blank_config', id: 17 } })
    .textButton({ text: '#долговременная_игра', payload: { cmd: 'tagator_blank_config', id: 18 } }).row()

    .textButton({ text: '#фурри', payload: { cmd: 'tagator_blank_config', id: 19 } })
    .textButton({ text: '#омегаверс', payload: { cmd: 'tagator_blank_config', id: 20 } }).row()
    .textButton({ text: '#постельные_сцены', payload: { cmd: 'tagator_blank_config', id: 21 } })
    .textButton({ text: '#перепихон', payload: { cmd: 'tagator_blank_config', id: 22 } }).row()

    .textButton({ text: '#14+', payload: { cmd: 'tagator_blank_config', id: 23 } })
    .textButton({ text: '#16+', payload: { cmd: 'tagator_blank_config', id: 24 } })//.row()
    .textButton({ text: '#18+', payload: { cmd: 'tagator_blank_config', id: 25 } })
    .textButton({ text: '#18++', payload: { cmd: 'tagator_blank_config', id: 26 } }).row()

    .textButton({ text: '#мск/мск-1', payload: { cmd: 'tagator_blank_config', id: 27 } })
    .textButton({ text: '#мск+1/2/3', payload: { cmd: 'tagator_blank_config', id: 28 } }).row()
    .textButton({ text: '#мск+4/5/6', payload: { cmd: 'tagator_blank_config', id: 29 } })
    .textButton({ text: '#мск+7/8/9', payload: { cmd: 'tagator_blank_config', id: 30 } }).row()

    .textButton({ text: '#многострочник', payload: { cmd: 'tagator_blank_config', id: 31 } })
    .textButton({ text: '#среднестрочник', payload: { cmd: 'tagator_blank_config', id: 32 } }).row()
    .textButton({ text: '#малострочник', payload: { cmd: 'tagator_blank_config', id: 33 } })
    .textButton({ text: '#разнострочник', payload: { cmd: 'tagator_blank_config', id: 34 } }).row()

    .textButton({ text: '#реал', payload: { cmd: 'tagator_blank_config', id: 35 } })
    .textButton({ text: '#внеролевое_общение', payload: { cmd: 'tagator_blank_config', id: 36 } }).row()
    .textButton({ text: '#литературный_стиль', payload: { cmd: 'tagator_blank_config', id: 37 } })
    .textButton({ text: '#полурол', payload: { cmd: 'tagator_blank_config', id: 38 } }).row()

    .textButton({ text: '#джен', payload: { cmd: 'tagator_blank_config', id: 39 } })
    .textButton({ text: '#гет', payload: { cmd: 'tagator_blank_config', id: 40 } })//.row()
    .textButton({ text: '#слэш', payload: { cmd: 'tagator_blank_config', id: 41 } })
    .textButton({ text: '#фемслэш', payload: { cmd: 'tagator_blank_config', id: 42 } }).row()

    .textButton({ text: '#актив', payload: { cmd: 'tagator_blank_config', id: 43 } })
    .textButton({ text: '#пассив', payload: { cmd: 'tagator_blank_config', id: 44 } })
    .textButton({ text: '#универсал', payload: { cmd: 'tagator_blank_config', id: 45 } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }).row()
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Настройте теги для своей анкеты для тегатора`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}
export async function Blank_Create_Prefab_Input_ON(context: MessageContext) {
    if (!context.chat.username) {
        return await Send_Message(context, 'Установите username в настройках профиля телеграмма своего аккаунта')
    }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_create_prefab_input_off'

	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Введите анкету нафиг`, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Blank_Edit_Prefab_Input_ON(context: MessageContext) {
    if (!context.chat.username) {
        return await Send_Message(context, 'Установите username в настройках профиля телеграмма своего аккаунта')
    }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_edit_prefab_input_off'

	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Введите измененную анкету:`, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}
export async function Blank_Delete(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
    ])
    const blank_delete = await prisma.blank.delete({ where: { id: blank_check.id } })
    if (blank_delete) { 
        await Send_Message(context, `✅ Успешно удалено:\n📜 Анкета: ${blank_delete.id}\n💬 Содержание:\n${blank_delete.text}`, keyboard)
        await Logger(`(private chat) ~ deleted self <blank> #${blank_delete.id} by <user> №${context.senderId}`)
    }
}

export async function Censored_Change(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const censored_change = await prisma.account.update({ where: { id: user_check.id }, data: { censored: user_check.censored ? false : true } })
    if (censored_change) { 
        const keyboard = InlineKeyboard.keyboard([
            [
                InlineKeyboard.textButton({ text: '✅ В меню', payload: { cmd: 'main_menu' } })
            ]
        ])
        await Send_Message(context, `🔧 Цензура ${censored_change.censored ? 'активирована' : 'отключена'}`, keyboard)
        await Logger(`(private chat) ~ changed status activity censored self by <user> №${context.chat.id}`)
    }
}