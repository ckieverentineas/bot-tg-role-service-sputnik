import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Blank_Vision_Activity, Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned, Verify_Blank_Not_Self, Verify_User } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { Blank } from "@prisma/client";
import { keyboard_back } from "../datacenter/tag";

export async function Random_Research(context: MessageContext) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    //const blank_check = user_verify.blank_check
    // подбираем случайную анкету
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
    if (!blank_build) { return await Send_Message(context, `😿 Очередь анкет закончилась, попробуйте вызвать 🎲 рандом позже.`, keyboard_back) }
    // формируем меню для найденной анкеты
    const selector: Blank = blank_build
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `, keyboard_back) }
    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    const text = `🛰️ Поисковой режим «Рандом-2000»:\n\n📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '⛔ Налево', payload: { cmd: 'blank_unlike', idb: selector.id } })
    .textButton({ text: `✅ Направо`, payload: { cmd: 'blank_like', idb: selector.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    if (user_check.donate == true) { 
        keyboard.textButton({ text: '✏ Направо', payload: { cmd: 'blank_like_don', idb: selector.id  } }).row() 
    } else { 
        keyboard.row() 
    }
    keyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'blank_report', idb: selector.id } })
    await Send_Message(context, `${text}`, keyboard, /*blank.photo*/)
    await Logger(`(research random) ~ show <blank> #${selector.id} for @${user_check.username}`)
}

export async function Blank_Like(context: MessageContext, queryPayload: any) {
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
	await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
	const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
	if (!mail_set) { return }
    await Send_Message_NotSelf(Number(user_nice.idvk) , `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
	await Logger(`(research random) ~ clicked swipe <blank> #${blank_nice.id} for @${user_self.username}`)
    await Random_Research(context)
}

export async function Blank_Unlike(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // помечаем анкету просмотренной
    await Blank_Vision_Activity(context, queryPayload.idb, user_self)
    await Send_Message(context, `✅ Пропускаем анкету #${queryPayload.idb}.`)
	await Logger(`(research random) ~ clicked unswipe for <blank> #${queryPayload.idb} for @${user_self.username}`)
    await Random_Research(context)
}

export async function Blank_Report(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // проверяем наличие жалобы на пользователя и его анкеты
    const blank_verify = await Verify_Blank_Not_Self(context, queryPayload.idb)
    if (!blank_verify) { return }
    //const user_report = blank_verify.user_nice
    const blank_report = blank_verify.blank_nice
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'blank_report_ION', idb: blank_report.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'random_research' } })
    // подтверждаем готовность ввода жалобы
    await Send_Message(context, `📎 Перед вводом жалобы подтвердите готовность, нажав кнопку [✏ Ввести жалобу]`, keyboard)
    await Logger(`(research random) ~ show prefab for report on <blank> #${blank_report.id} by @${user_self.username}`)
}

export async function Blank_Report_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // проверяем на попытку повторной жалобы
    const report_check = await prisma.report.findFirst({ where: { id_blank:  queryPayload.idb, id_account: user_self.id }})
    if (report_check) { return await Send_Message(context, `⚠ Вы уже подавали жалобу на анкету ${report_check.id_blank}`)}
    // подготовка системы к вводу данных пользователем для жалобьы на анкету
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_report_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
    await Send_Message(context, `🧷 Введите причину жалобы от 10 до 2000 символов:`)
    await Logger(`(research random) ~ starting write report on <blank> #${queryPayload.idb} by @${user_self.username}`)
}

export async function Blank_Like_Donation_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    //const blank_self = user_verify.blank_check
    // подготовка системы к вводу данных пользователем для жирного донатного лайка на анкету
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_like_donation_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
    await Send_Message(context, `🧷 Введите приватное сообщение пользователю от 10 до 3000 символов:`)
    await Logger(`(research random) ~ starting write message for donation like on <blank> #${queryPayload.idb} by @${user_self.username}`)
}