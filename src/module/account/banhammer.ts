import { InlineKeyboard, MessageContext } from "puregram"
import prisma from "../prisma"
import { Logger, Online_Set, Send_Message, User_Banned } from "../helper"

export async function UnBanHammer(context: MessageContext, queryPayload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован, обратитесь к @beskoletov для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ]
    ])
    const blacklist_check = await prisma.blackList.findFirst({ where: { id: queryPayload.idb }})
    if (!blacklist_check) { return }
    const blacklist_delete = await prisma.blackList.delete({ where: { id: queryPayload.idb } })
    
    if (!blacklist_delete) { return }
    const unblacklist = await prisma.account.findFirst({ where: { idvk: blacklist_delete.idvk } })
    if (!unblacklist) { return }
    await Send_Message(context, `✅ Успешно убран из черного списка ролевик @${unblacklist.username}`, keyboard)
    await Logger(`(private chat) ~ deleted self <blank> #${blacklist_delete.id} by <user> №${context.chat.id}`)
    
}