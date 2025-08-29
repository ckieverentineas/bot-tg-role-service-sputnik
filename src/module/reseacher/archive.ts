import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Blank_Vision_Activity, Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned, Verify_Blank_Not_Self, Verify_User, Format_Text_With_Tags } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { Blank } from "@prisma/client";
import { keyboard_back, getTagsForBlank } from "../datacenter/tag";

export async function Archive_Research(context: MessageContext) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    const blank_check = user_verify.blank_check
    // подбираем случайную анкету из уже просмотренных
    let blank_build = null
    for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
        if (blank.id_account == user_check.id) { continue }
        const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
        if (!vision_check) { continue }
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
    if (!blank_build) { return await Send_Message(context, `😿 Очередь анкет закончилась, попробуйте вызвать архивариус позже.`, keyboard_back) }
    // формируем меню для найденной анкеты
    const selector: Blank = blank_build
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `) }
    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    
    // --- добавляем теги ---
    const tags = await getTagsForBlank(selector.id)
    const baseText = `🛰️ Поисковый режим «Архив-1000»:\n\n📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, selector.id, tags)
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'archive_unlike', idb: selector.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'archive_like', idb: selector.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    //if (await Accessed(context) != `user`) { keyboard.textButton({ text: '🛠✏ Письмо', payload: { cmd: 'archive_like_donation' } }) }
    await Send_Message(context, `${text}`, keyboard)
    await Logger(`(research archive) ~ show <blank> #${selector.id} for @${user_check.username}`)
}

// --- новый обработчик для показа тегов в архиве ---
export async function Show_Tags_Archive(context: MessageContext, queryPayload: any) {
    const tags = await getTagsForBlank(queryPayload.idb)
    const tagsText = tags.length ? tags.map((t: {name: string}) => `#${t.name}`).join("\n") : "Тегов нет"
    
    const keyboard = new InlineKeyboardBuilder()
        .textButton({ text: "⬅ Назад к анкете", payload: { cmd: "archive_research_show_blank", idb: queryPayload.idb } })

    await Send_Message(context, `🏷 Теги анкеты #${queryPayload.idb}:\n\n${tagsText}`, keyboard)
    await Logger(`(research archive) ~ show tags for <blank> #${queryPayload.idb}`)
}

// --- функция для показа конкретной анкеты в архиве ---
export async function Archive_Research_Show_Blank(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    
    // Получаем анкету по ID
    const blank_check_notself = await prisma.blank.findFirst({ 
        where: { 
            id: queryPayload.idb,
            banned: false 
        } 
    })
    
    if (!blank_check_notself) {
        return await Send_Message(context,
            `⚠ Внимание, анкета #${queryPayload.idb} была удалена владельцем или забанена`,
            keyboard_back)
    }

    let censored = user_check.censored ? await Censored_Activation_Pro(blank_check_notself.text) : blank_check_notself.text
    
    // Используем новую систему форматирования с тегами
    const baseText = `🛰️ Поисковый режим «Архив-1000»:\n\n📜 Анкета: ${blank_check_notself.id}\n💬 Содержание:\n${censored}`
    const tags = await getTagsForBlank(blank_check_notself.id)
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, blank_check_notself.id, tags)
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'archive_unlike', idb: blank_check_notself.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'archive_like', idb: blank_check_notself.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    await Send_Message(context, `${text}`, keyboard)
    await Logger(`(research archive) ~ show specific <blank> #${blank_check_notself.id} for @${user_check.username}`)
}

export async function Archive_Like(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    // проверяем наличие понравившегося пользователя и его анкеты
    const blank_verify = await Verify_Blank_Not_Self(context, queryPayload.idb)
    if (!blank_verify) { return }
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, queryPayload.idb, user_self)
	await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла в архивариусе, отправляем информацию об этом его/её владельцу.`)
	const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
	if (!mail_set) { return }
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Вашу анкету #${blank_nice.id} кто-то достал из архива и лайкнул, загляните в почту.`) 
	await Logger(`(research archive) ~ clicked swipe <blank> #${blank_nice.id} for @${user_self.username}`)
    await Archive_Research(context)
}

export async function Archive_Unlike(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, queryPayload.idb, user_self)
    await Send_Message(context, `✅ Пропускаем анкету #${queryPayload.idb} в архивариусе.`)
	await Logger(`(research archive) ~ clicked unswipe for <blank> #${queryPayload.idb} for @${user_self.username}`)
    await Archive_Research(context)
}