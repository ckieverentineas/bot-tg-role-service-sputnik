import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram"
import prisma from "../prisma"
import { Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned, Verify_Blank_Not_Self, Verify_User } from "../helper"
import { Mail } from "@prisma/client"
import { Censored_Activation_Pro } from "../other/censored"
import { chat_id_system } from "../.."
import { keyboard_back } from "../datacenter/tag"

export async function Mail_Self(context: MessageContext) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    const blank_check = user_verify.blank_check
    // ищем входящие письма
	let mail_build = null
	for (const mail of await prisma.mail.findMany({ where: { blank_to: blank_check.id, read: false, find: true } })) {
		mail_build = mail
        break
	}
    if (!mail_build) { return await Send_Message(context, `😿 Письма кончились, приходите позже.`, keyboard_back) }
	const selector: Mail = mail_build
	const blank_to_check = await prisma.blank.findFirst({ where: { id: selector.blank_to } })
	const blank_from_check = await prisma.blank.findFirst({ where: { id: selector.blank_from } })
    const keyboard_mail_fail = new InlineKeyboardBuilder()
    .textButton({ text: `📬 Дальше`, payload: { cmd: 'mail_self' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
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
	const text = `🛰️ Почтовый сервис «Сова-5000»\n\n🔔 Ваша анкета #${blank_to_check.id} понравилась автору следующей анкеты:\n 📜 Анкета: ${blank_from_check.id}\n💬 Содержание:\n${censored}`
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '⛔ Мимо', payload: { cmd: 'mail_unlike', idm: selector.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'mail_like', idm: selector.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, text, keyboard)
    await Logger(`(mailbox) ~ show <blank> #${selector.id} for @${user_check.username}`)
}

export async function Mail_Like(context: MessageContext, queryPayload: any) {
    const mail_nice = await prisma.mail.findFirst({ where: { id: queryPayload.idm, read: false, find: true }})
    if (!mail_nice) { return }
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    // проверяем наличие понравившегося пользователя и его анкеты
    const blank_verify = await Verify_Blank_Not_Self(context, mail_nice.blank_from )
    if (!blank_verify) { return }
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    // лайкаем анкету в почте
    await Online_Set(context)
    const mail_skip = await prisma.mail.update({ where: { id: queryPayload.idm }, data: { read: true, status: true } })
    await Send_Message(context, `🔊 Недавно вам понравилась анкета #${blank_nice.id}, знайте, что это взаимно на вашу анкету #${blank_self.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с @${user_nice.username}!`)
    await Send_Message_NotSelf(Number(user_nice.idvk), `🔊 Недавно вам понравилась анкета #${blank_self.id}, знайте, что это взаимно на вашу анкету #${blank_nice.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с @${user_self.username}!`)
    const ans_selector = `🌐 Анкеты №${blank_nice.id} + №${blank_self.id} = [ролевики никогда]!`
    await Send_Message_NotSelf(Number(chat_id_system), ans_selector)
    await Logger(`(mailbox) ~ clicked like for <blank> #${blank_nice.id} by @${user_self.username}`)
    await Mail_Self(context)
}

export async function Mail_Unlike(context: MessageContext, queryPayload: any) {
    const mail_nice = await prisma.mail.findFirst({ where: { id: queryPayload.idm, read: false, find: true }})
    if (!mail_nice) { return }
    await Online_Set(context)
    const mail_skip = await prisma.mail.update({ where: { id: queryPayload.idm }, data: { read: true } })
    await Send_Message(context, `✅ Игнорируем анкету #${mail_nice.blank_from} полностью.`)
    await Logger(`(mailbox) ~ clicked like for <blank> #${mail_nice.blank_to} by @${context.chat.id}`)
    await Mail_Self(context)
}