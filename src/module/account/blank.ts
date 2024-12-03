import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message, User_Banned } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";

export async function Blank_Self(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return }
	//await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    const keyboard = InlineKeyboard.keyboard([
        (blank_check) ?
        [
          InlineKeyboard.textButton({ text: '⛔ Удалить', payload: 'blank_delete' }),
          InlineKeyboard.textButton({ text: '✏ Изменить', payload: 'blank_edit' })
        ] :
        [
          InlineKeyboard.textButton({ text: '➕ Создать', payload: 'blank_create' })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: 'main_menu' })
        ]
    ])
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
	if (banned_me) { return }
	//await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '✏ Ввести анкету', payload: 'blank_create_prefab_input_on' })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: 'main_menu' })
        ]
    ])
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Перед вводом анкеты подтвердите готовность нажав кнопку Ввести анкету`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Blank_Create_Prefab_Input_ON(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return }
	//await Online_Set(context)
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

export async function Blank_Delete(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return }
	//await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) {
        await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
        return
    }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: 'main_menu' })
        ]
    ])
    const blank_delete = await prisma.blank.delete({ where: { id: blank_check.id } })
    if (blank_delete) { 
        await Send_Message(context, `✅ Успешно удалено:\n📜 Анкета: ${blank_delete.id}\n💬 Содержание:\n${blank_delete.text}`, keyboard)
        await Logger(`(private chat) ~ deleted self <blank> #${blank_delete.id} by <user> №${context.senderId}`)
    }
}