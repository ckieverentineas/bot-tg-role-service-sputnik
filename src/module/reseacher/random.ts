import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message, Send_Message_NotSelf, User_Banned } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { Blank } from "@prisma/client";

export async function Random_Research(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    if (!blank_check) { return await Send_Message(context, `⚠ Создайте анкету`) }
    const banned_me = await User_Banned(context)
    if (banned_me) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    //await Online_Set(context)
    let blank_build = null
    for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
        if (blank.id_account == user_check.id) { continue }
        const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
        if (vision_check) { continue }
        // если автор анкеты в моем черном списке, то пропускаем
        const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
        const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: Number(user_bl_ch?.idvk) ?? 0 } })
        if (black_list_my) { continue }
        // если автор анкеты добавил меня в черном списке, то пропускаем
        const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: Number(user_check.idvk) } })
        if (black_list_other) { continue }
        blank_build = blank
        break
    }
    await Logger(`(private chat) ~ starting check random blank by <user> №${context.senderId}`)
    const keyboard_end_blank_query = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    if (!blank_build) { return await Send_Message(context, `😿 Очередь анкет закончилась, попробуйте вызвать 🎲 рандом позже.`, keyboard_end_blank_query) }
    const selector: Blank = blank_build
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `) }
    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    const text = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '⛔ Налево', payload: { cmd: 'blank_unlike', idb: selector.id } }),
            InlineKeyboard.textButton({ text: `✅ Направо`, payload: { cmd: 'blank_like', idb: selector.id } })
        ],
        (await Accessed(context) != `user`) ?
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
            InlineKeyboard.textButton({ text: '🛠✏ Направо', payload: { cmd: 'blank_like_donation' } })
        ] :
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ],
        [
            InlineKeyboard.textButton({ text: '🛠⚠ Жалоба', payload: { cmd: 'blank_report', idb: selector.id } })
        ]
    ])
    await Send_Message(context, `${text}`, keyboard, /*blank.photo*/)
}

export async function Blank_Like(context: MessageContext, queryPayload: any) {
    
    // проверяем наличие понравившегося пользователя и его анкеты
    const blank_nice = await prisma.blank.findFirst({ where: { id: queryPayload.idb } })
    if (!blank_nice) { return }
    const user_nice = await prisma.account.findFirst({ where: { id: blank_nice.id_account } })
    if (!user_nice) { return }
    // проверям себя и свою анкету
    const user_self = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_self) { return }
    const blank_self = await prisma.blank.findFirst({ where: { id_account: user_self.id } })
    if (!blank_self) { return }
    // проверяем анкету на просмотр и в случае чего делаем просмотренной
    const blank_vision_check = await prisma.vision.findFirst({ where: { id_account: context.chat.id, id_blank: queryPayload.idb }})
	if (!blank_vision_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_self.id, id_blank: queryPayload.idb } }) }
	await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
	const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
	if (!mail_set) { return }
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
	await Logger(`(private chat) ~ clicked swipe for <blank> #${blank_nice.id} by <user> №${context.chat.id}`)
    await Random_Research(context)
}

export async function Blank_Unlike(context: MessageContext, queryPayload: any) {
    // проверям себя и свою анкету
    const user_self = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_self) { return }
    const blank_self = await prisma.blank.findFirst({ where: { id_account: user_self.id } })
    if (!blank_self) { return }
    // проверяем анкету на просмотр и в случае чего делаем просмотренной
    const blank_vision_check = await prisma.vision.findFirst({ where: { id_account: context.chat.id, id_blank: queryPayload.idb }})
	if (!blank_vision_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_self.id, id_blank: queryPayload.idb } }) }
    await Send_Message(context, `✅ Пропускаем анкету #${queryPayload.idb}.`)
	await Logger(`(private chat) ~ clicked unswipe for <blank> #${queryPayload.idb} by <user> №${context.senderId}`)
    await Random_Research(context)
}