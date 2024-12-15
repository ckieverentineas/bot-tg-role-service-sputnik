import { MessageContext } from "puregram"
import prisma from "../prisma"
import { Accessed, Logger, Online_Set, Send_Message, User_Banned, Verify_User } from "../helper"
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr"
import { users_pk } from "../.."

export async function Sniper_Research_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // подготовка системы к вводу данных пользователем для идентификатора анкеты снайперским выстрелом
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'sniper_research_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `🧷 Введите номер анкеты для доступа через гипер-пространство, игнорируя ${await Accessed(context) != `user` ? 'банхаммер,' : ''} просмотренный список анкет:`, /*blank.photo*/)
    await Logger(`(research sniper) ~ starting write target for sniper shot for <blank> #${queryPayload.idb} by @${user_self.username}`)
}