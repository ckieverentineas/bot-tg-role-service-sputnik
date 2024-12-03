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
        const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
        if (black_list_my) { continue }
        // если автор анкеты добавил меня в черном списке, то пропускаем
        const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
        if (black_list_other) { continue }
        blank_build = blank
        break
    }
    await Logger(`(private chat) ~ starting check random blank by <user> №${context.senderId}`)
    if (!blank_build) { return await Send_Message(context, `😿 Очередь анкет закончилась, попробуйте вызвать 🎲 рандом позже.`) }
    const selector: Blank = blank_build
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `) }
    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    const text = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '🛠⛔ Налево', payload: { command: 'blank_unlike', idb: selector.id, idbs: blank_check.id, ida: selector.id_account } }),
            InlineKeyboard.textButton({ text: `🛠✅ Направо`, payload: { command: 'blank_like', idb: selector.id, idbs: blank_check.id, ida: selector.id_account } })
        ],
        (await Accessed(context) != `user`) ?
        [
            InlineKeyboard.textButton({ text: '🛠🚫 Назад', payload: { command: 'main_menu' } }),
            InlineKeyboard.textButton({ text: '🛠✏ Направо', payload: { command: 'blank_like_donation' } })
        ] :
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { command: 'main_menu' } })
        ],
        [
            InlineKeyboard.textButton({ text: '🛠⚠ Жалоба', payload: { command: 'blank_report', idb: selector.id, idbs: blank_check.id, ida: selector.id_account } })
        ]
    ])
    await Send_Message(context, `${text}`, keyboard, /*blank.photo*/)
}

export async function Blank_Like(context: MessageContext, queryPayload: any) {
    const blank_vision_check = await prisma.vision.findFirst({ where: { id_account: context.chat.id, id_blank: queryPayload.idb }})
	//if (!blank_vision_check) { const blank_skip = await prisma.vision.create({ data: { id_account: context.chat.id, id_blank: queryPayload.id_blank } }) }
    const user_nice = await prisma.account.findFirst({ where: { id: queryPayload.ida } })
    if (!user_nice) { return }
    const blank_nice = await prisma.blank.findFirst({ where: { id: queryPayload.idb } })
    if (!blank_nice) { return }
	await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
	//const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: queryPayload.id_blank_self ?? 0 }})
	//if (mail_set) { await Send_Message(user_nice?.idvk ?? user_check.idvk, `🔔 Ваша анкета #${selector.id} понравилась кому-то, загляните в почту.`) }
    await Send_Message_NotSelf(user_nice.idvk, `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`)
	await Logger(`(private chat) ~ clicked swipe for <blank> #${blank_nice.id} by <user> №${context.chat.id}`)
}