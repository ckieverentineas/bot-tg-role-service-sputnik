import { MessageContext } from "puregram"
import prisma from "../prisma"
import { Accessed, Logger, Online_Set, Send_Message, User_Banned } from "../helper"
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr"
import { users_pk } from "../.."

export async function Sniper_Research_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
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
    users_pk[id].operation = 'sniper_research_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `🧷 Введите номер анкеты для доступа через гипер-пространство, игнорируя ${await Accessed(context) != `user` ? 'банхаммер,' : ''} просмотренный список анкет:`, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}