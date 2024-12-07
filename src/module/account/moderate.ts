import { InlineKeyboard, MessageContext } from "puregram"
import prisma from "../prisma"
import { Accessed, Logger, Send_Message, Send_Message_NotSelf, User_Banned } from "../helper"
import { Blank, Mail } from "@prisma/client"
import { Censored_Activation_Pro } from "../other/censored"

export async function Moderate_Self(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
	if (!user_check) { return }
	//await Online_Set(context)
    if (await Accessed(context) == 'user') { return }
	let mail_build = null
	for (const blank of await prisma.blank.findMany({ where: { banned: true } })) {
		mail_build = blank
        break
	}
    const keyboard_end_blank_query = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    if (!mail_build) { return await Send_Message(context, `😿 Забаненные анкеты кончились, приходите позже.`, keyboard_end_blank_query) }
	await Logger(`(private chat) ~ starting check banned blanks by <admin> №${context.senderId}`)
	const selector: Blank = mail_build

    for (const report of await prisma.report.findMany({ where: { id_blank: selector.id, status: 'wait' } })) {
        const user = await prisma.account.findFirst({ where: { id: report.id_account } })
        await Send_Message(context, `🗿 Жалоба от @${user?.username}(КрысаХ):\n💬 Заявление: ${report.text}\n\n`)
    }
    const user_warned = await prisma.account.findFirst({ where: { id: selector.id_account } })
	const text = `⚖ Вершится суд над следующей анкетой и ее автором:\n📜 Анкета: ${selector.id}\n👤 Автор: @${user_warned?.username}\n💬 Содержание:\n${selector.text}`
    //выдача анкеты с фото
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '⛔ Отклонить', payload: { cmd: 'moderate_denied', idb: selector.id } }),
            InlineKeyboard.textButton({ text: `✅ Заверить`, payload: { cmd: 'moderate_success', idb: selector.id } })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    await Send_Message(context, text, keyboard)
    await Logger(`(private chat) ~ finished check banned blanks by <admin> №${context.chat.id}`)
}

export async function Moderate_Success(context: MessageContext, queryPayload: any) {
    const blank_report_check = await prisma.blank.findFirst({ where: { id: queryPayload.idb } })
    if (!blank_report_check) { return }
    if (!blank_report_check.banned) { return }
    const user_report_check = await prisma.account.findFirst({ where: { id: blank_report_check.id_account } })
    if (!user_report_check) { return }
    for (const report of await prisma.report.findMany({ where: { id_blank: blank_report_check.id, status: 'wait' } })) {
        await prisma.report.update({ where: { id: report.id }, data: { status: 'success'}})
        const user = await prisma.account.findFirst({ where: { id: report.id_account } })
        await Send_Message_NotSelf(Number(user!.idvk), `✅ Ваша жалоба на анкету ${blank_report_check.id} принята, спасибо за службу.`)
    }
    const warn_skip = await prisma.blank.delete({ where: { id: blank_report_check.id } })
    await Send_Message_NotSelf(Number(user_report_check.idvk), `⛔ Ваша анкета #${blank_report_check.id} нарушает правила, она удалена, в следующий раз будьте бдительней, поставили вас на учет.`)
	await Logger(`(private chat) ~ warn success for <blank> #${blank_report_check.id} by <admin> №${context.chat.id}`)
	await Send_Message(context, `✅ Выдали пред владельцу анкеты #${blank_report_check.id}`)
    await Moderate_Self(context)
}

export async function Moderate_Denied(context: MessageContext, queryPayload: any) {
    const blank_report_check = await prisma.blank.findFirst({ where: { id: queryPayload.idb } })
    if (!blank_report_check) { return }
    if (!blank_report_check.banned) { return }
    const user_report_check = await prisma.account.findFirst({ where: { id: blank_report_check.id_account } })
    if (!user_report_check) { return }
    for (const report of await prisma.report.findMany({ where: { id_blank: blank_report_check.id, status: 'wait' } })) {
        await prisma.report.update({ where: { id: report.id }, data: { status: 'denied'}})
        const user = await prisma.account.findFirst({ where: { id: report.id_account } })
        await Send_Message_NotSelf(Number(user!.idvk), `⛔ Ваша жалоба на анкету ${blank_report_check.id} отклонена.`)
    }
    const warn_skip = await prisma.blank.update({ where: { id: blank_report_check.id }, data: { banned: false } })
    await Send_Message_NotSelf(Number(user_report_check.idvk), `✅ Ваша анкета #${blank_report_check.id} была оправдана, доступ разблокирован.`)
	await Logger(`(private chat) ~ unlock for <blank> #${blank_report_check.id} by <admin> №${context.chat.id}`)
	await Send_Message(context, `✅ Оправдали владельца анкеты #${blank_report_check.id}`)
    await Moderate_Self(context)
}