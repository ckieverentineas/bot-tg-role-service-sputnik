import { InlineKeyboard, MessageContext } from "puregram"
import prisma from "../prisma"
import { Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned } from "../helper"
import { Mail } from "@prisma/client"
import { Censored_Activation_Pro } from "../other/censored"
import { chat_id_system } from "../.."

export async function Mail_Self(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
	if (!user_check) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    if (!blank_check) { return await Send_Message(context, `Чтобы воспользоваться почтой, нажмите кнопку в главном меню "📃 Моя анкета" или вызовите команду !анкета в чате для создания анкеты персонажа`)}
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
	await Online_Set(context)
	let mail_build = null
	for (const mail of await prisma.mail.findMany({ where: { blank_to: blank_check.id, read: false, find: true } })) {
		mail_build = mail
        break
	}
    const keyboard_end_blank_query = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    if (!mail_build) { return await Send_Message(context, `😿 Письма кончились, приходите позже.`, keyboard_end_blank_query) }
	await Logger(`(private chat) ~ starting check self mail by <user> №${context.senderId}`)
	const selector: Mail = mail_build
	const blank_to_check = await prisma.blank.findFirst({ where: { id: selector.blank_to } })
	const blank_from_check = await prisma.blank.findFirst({ where: { id: selector.blank_from } })
    const keyboard_mail_fail = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: `📬 Дальше`, payload: { cmd: 'mail_self' } })
        ]
    ])
	if (!blank_to_check || !blank_from_check) { 
		const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
		return await Send_Message(context, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваша или опоннента анкета не были найдены, сообщение было помечено не найденным\n `, keyboard_mail_fail)
	}
	const account_to = await prisma.account.findFirst({ where: { id: blank_to_check.id_account } })
	const account_from = await prisma.account.findFirst({ where: { id: blank_from_check.id_account } })
	if (!account_to || !account_from) {
		const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
		return await Send_Message(context, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваc или опоннента больше нет в системе, сообщение было помечено не найденным\n `, keyboard_mail_fail)
	}
	let censored = user_check.censored ? await Censored_Activation_Pro(blank_from_check.text) : blank_from_check.text
	//выдача анкеты с фото
	const text = `🔔 Ваша анкета #${blank_to_check.id} понравилась автору следующей анкеты:\n 📜 Анкета: ${blank_from_check.id}\n💬 Содержание:\n${censored}`
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '⛔ Налево', payload: { cmd: 'mail_unlike', idm: selector.id } }),
            InlineKeyboard.textButton({ text: `✅ Направо`, payload: { cmd: 'mail_like', idm: selector.id } })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    await Send_Message(context, text, keyboard)
    await Logger(`(private chat) ~ finished check self mail by <user> №${context.chat.id}`)
}

export async function Mail_Like(context: MessageContext, queryPayload: any) {
    const mail_nice = await prisma.mail.findFirst({ where: { id: queryPayload.idm, read: false, find: true }})
    if (!mail_nice) { return }
    // проверяем наличие понравившегося пользователя и его анкеты
    const blank_nice = await prisma.blank.findFirst({ where: { id: mail_nice.blank_from } })
    if (!blank_nice) { return }
    const user_nice = await prisma.account.findFirst({ where: { id: blank_nice.id_account } })
    if (!user_nice) { return }
    // проверям себя и свою анкету
    const user_self = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_self) { return }
    const blank_self = await prisma.blank.findFirst({ where: { id_account: user_self.id } })
    if (!blank_self) { return }
    // лайкаем анкету в почте
    await Online_Set(context)
    const mail_skip = await prisma.mail.update({ where: { id: queryPayload.idm }, data: { read: true, status: true } })
    await Send_Message(context, `🔊 Недавно вам понравилась анкета #${blank_nice.id}, знайте, что это взаимно на вашу анкету #${blank_self.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с @${user_nice.username}!`)
    await Send_Message_NotSelf(Number(user_nice.idvk), `🔊 Недавно вам понравилась анкета #${blank_self.id}, знайте, что это взаимно на вашу анкету #${blank_nice.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с @${user_self.username}!`)
    const ans_selector = `🌐 Анкеты №${blank_nice.id} + №${blank_self.id} = [ролевики никогда]!`
    await Send_Message_NotSelf(Number(chat_id_system), ans_selector)
    await Logger(`(private chat) ~ clicked like for <blank> #${blank_nice.id} by <user> №${context.senderId}`)
    await Mail_Self(context)
}

export async function Mail_Unlike(context: MessageContext, queryPayload: any) {
    const mail_nice = await prisma.mail.findFirst({ where: { id: queryPayload.idm, read: false, find: true }})
    if (!mail_nice) { return }
    await Online_Set(context)
    const mail_skip = await prisma.mail.update({ where: { id: queryPayload.idm }, data: { read: true } })
    await Send_Message(context, `✅ Игнорируем анкету #${mail_nice.blank_from} полностью.`)
    await Logger(`(private chat) ~ clicked unlike for <blank> #${mail_nice.blank_to} by <user> №${context.senderId}`)
    await Mail_Self(context)
}