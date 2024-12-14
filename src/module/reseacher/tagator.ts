import { InlineKeyboard, MessageContext, InlineKeyboardBuilder } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Online_Set, Send_Message, Send_Message_NotSelf, User_Banned } from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { Blank } from "@prisma/client";
import { getTagById } from "../datacenter/tag";

export async function Tagator_Menu(context: MessageContext) {
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '🚀 Погнали СУрКИ', payload: { cmd: 'tagator_research' } }).row()
    .textButton({ text: '✅ Искать по тегам', payload: { cmd: 'tagator_research_config_like' } }).row()
    .textButton({ text: '⛔ Исключить теги', payload: { cmd: 'tagator_research_config_unlike' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `🔎 Добро пожаловать в поисковую систему "Тегатор-3000", перед началом не забудьте настроить, кого ищите, и исключить кого вам точно нафиг не надо.`, keyboard)
}
export async function Tagator_Research(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const banned_me = await User_Banned(context)
    if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    if (!blank_check) { return await Send_Message(context, `⚠ Создайте анкету`) }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    await Online_Set(context)
    let blank_build = null
    const tag_self_like = user_check.tag_like != null ? JSON.parse(user_check.tag_like ?? []) : []
    if (tag_self_like.length < 1) { return await Send_Message(context, `Настройте теги, по которым будем искать`) }
    const tag_self_unlike = user_check.tag_unlike != null ? JSON.parse(user_check.tag_unlike ?? []) : []
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
        // тегосверка
        const tag_blank_pull = blank.tag != null ? JSON.parse(blank.tag ?? []) : []
        if (tag_blank_pull == null || tag_blank_pull.length < 1) { continue }
        // исключаем анкету с не понравившимися тегами
        let tr_unlike_blank = false
        for (const tag_s_un of tag_self_unlike) {
            if (tag_blank_pull.includes(tag_s_un)) {
                tr_unlike_blank = true
                break
            }
        }
        if (tr_unlike_blank) { continue }
        let tr_like_blank = false
        for (const tag_s_l of tag_self_like) {
            if (tag_blank_pull.includes(tag_s_l)) {
                tr_like_blank = true
                blank_build = blank
                break
            }
        }
        if (tr_like_blank) { break }
    }
    await Logger(`(private chat) ~ starting check random blank by <user> №${context.senderId}`)
    const keyboard_end_blank_query = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
        ]
    ])
    if (!blank_build) { return await Send_Message(context, `😿 Очередь пустая, попробуйте использовать другие теги, или исключить исключаемые теги.`, keyboard_end_blank_query) }
    const selector: Blank = blank_build
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { return await Send_Message(context, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `) }
    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    const text = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '⛔ Налево', payload: { cmd: 'tagator_unlike', idb: selector.id } }),
            InlineKeyboard.textButton({ text: `✅ Направо`, payload: { cmd: 'tagator_like', idb: selector.id } })
        ],
        (user_check.donate == true) ?
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } }),
            InlineKeyboard.textButton({ text: '‼✏ Направо', payload: { cmd: 'tagator_like_don', idb: selector.id  } })
        ] :
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
        ],
        [
            InlineKeyboard.textButton({ text: '‼⚠ Жалоба', payload: { cmd: 'tagator_report', idb: selector.id } })
        ]
    ])
    await Send_Message(context, `${text}`, keyboard, /*blank.photo*/)
}

export async function Tagator_Like(context: MessageContext, queryPayload: any) {
    
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
    await Tagator_Research(context)
}

export async function Tagator_Unlike(context: MessageContext, queryPayload: any) {
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
    await Tagator_Research(context)
}

export async function Blank_Report(context: MessageContext, queryPayload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    // проверяем наличие жалобы на пользователя и его анкеты
    const blank_report = await prisma.blank.findFirst({ where: { id: queryPayload.idb } })
    if (!blank_report) { return }
    const user_report = await prisma.account.findFirst({ where: { id: blank_report.id_account } })
    if (!user_report) { return }
    const keyboard = InlineKeyboard.keyboard([
        [
            InlineKeyboard.textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'blank_report_ION', idb: blank_report.id } })
        ],
        [
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'tagator_research' } })
        ]
    ])
    // подтверждаем готовность ввода жалобы
	await Logger(`(private chat) ~ starting report writing on <blank> #${blank_report.id} by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Перед вводом жалобы подтвердите готовность нажав кнопку Ввести жалобу`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Tagator_Report_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    const report_check = await prisma.report.findFirst({ where: { id_blank:  queryPayload.idb, id_account: user_check.id }})
    if (report_check) { return await Send_Message(context, `Вы уже подавали жалобу на анкету ${report_check.id_blank}`)}
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'blank_report_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `🧷 Введите причину жалобы от 10 до 2000 символов:`, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Tagator_Like_Donation_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
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
    users_pk[id].operation = 'blank_like_donation_prefab_input_off'
	users_pk[id].id_target = queryPayload.idb
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `🧷 Введите приватное сообщение пользователю от 10 до 3000 символов:`, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Tagator_Research_Config_Like(context: MessageContext, queryPayload: any) {
    //console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    if (user_check.tag_like == null) { await prisma.account.update({ where: { id: user_check.id }, data: { tag_like: JSON.stringify([]) } })} 
    let tag = user_check.tag_like != null ? JSON.parse(user_check.tag_like ?? []) : []
    const id_tag = queryPayload.id ? Number(queryPayload.id) : null
    const tag_sel = queryPayload.id && id_tag ? await getTagById(id_tag) : null
    if (tag_sel) { 
        if (tag.includes(id_tag)) {
            tag = tag.filter((selectedId: any) => selectedId !== id_tag);
        } else {
            tag = [...tag, id_tag];
        }
        await prisma.account.update({ where: { id: user_check.id }, data: { tag_like: JSON.stringify(tag) } })
    }
    let tags = ''
    for (const i of tag) {
        console.log(i)
        tags += `${await getTagById(i)} `
    }
    await Send_Message(context, `Вы выбрали следующие теги нафиг: ${tags}`)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '#фандом', payload: { cmd: 'tagator_research_config_like', id: 1 } })
    .textButton({ text: '#ориджинал', payload: { cmd: 'tagator_research_config_like', id: 2 } }).row()

    .textButton({ text: '#научная_фантастика', payload: { cmd: 'tagator_research_config_like', id: 3 } })
    .textButton({ text: '#фантастика', payload: { cmd: 'tagator_research_config_like', id: 4 } }).row()
    .textButton({ text: '#фэнтези', payload: { cmd: 'tagator_research_config_like', id: 5 } })
    .textButton({ text: '#приключения', payload: { cmd: 'tagator_research_config_like', id: 6} })
    .textButton({ text: '#военное', payload: { cmd: 'tagator_research_config_like', id: 7 } }).row()
    .textButton({ text: '#историческое', payload: { cmd: 'tagator_research_config_like', id: 8 } })
    .textButton({ text: '#детектив', payload: { cmd: 'tagator_research_config_like', id: 9 } })
    .textButton({ text: '#криминал', payload: { cmd: 'tagator_research_config_like', id: 10 } }).row()
    .textButton({ text: '#экшен', payload: { cmd: 'tagator_research_config_like', id: 11 } })
    .textButton({ text: '#ужасы', payload: { cmd: 'tagator_research_config_like', id: 12 } })
    .textButton({ text: '#драма', payload: { cmd: 'tagator_research_config_like', id: 13 } })
    .textButton({ text: '#мистика', payload: { cmd: 'tagator_research_config_like', id: 14 } }).row()
    .textButton({ text: '#психология', payload: { cmd: 'tagator_research_config_like', id: 15 } })
    .textButton({ text: '#повседневность', payload: { cmd: 'tagator_research_config_like', id: 16 } }).row()
    .textButton({ text: '#романтика', payload: { cmd: 'tagator_research_config_like', id: 17 } })
    .textButton({ text: '#долговременная_игра', payload: { cmd: 'tagator_research_config_like', id: 18 } }).row()

    .textButton({ text: '#фурри', payload: { cmd: 'tagator_research_config_like', id: 19 } })
    .textButton({ text: '#омегаверс', payload: { cmd: 'tagator_research_config_like', id: 20 } }).row()
    .textButton({ text: '#постельные_сцены', payload: { cmd: 'tagator_research_config_like', id: 21 } })
    .textButton({ text: '#перепихон', payload: { cmd: 'tagator_research_config_like', id: 22 } }).row()

    .textButton({ text: '#14+', payload: { cmd: 'tagator_research_config_like', id: 23 } })
    .textButton({ text: '#16+', payload: { cmd: 'tagator_research_config_like', id: 24 } })//.row()
    .textButton({ text: '#18+', payload: { cmd: 'tagator_research_config_like', id: 25 } })
    .textButton({ text: '#18++', payload: { cmd: 'tagator_research_config_like', id: 26 } }).row()

    .textButton({ text: '#мск/мск-1', payload: { cmd: 'tagator_research_config_like', id: 27 } })
    .textButton({ text: '#мск+1/2/3', payload: { cmd: 'tagator_research_config_like', id: 28 } }).row()
    .textButton({ text: '#мск+4/5/6', payload: { cmd: 'tagator_research_config_like', id: 29 } })
    .textButton({ text: '#мск+7/8/9', payload: { cmd: 'tagator_research_config_like', id: 30 } }).row()

    .textButton({ text: '#многострочник', payload: { cmd: 'tagator_research_config_like', id: 31 } })
    .textButton({ text: '#среднестрочник', payload: { cmd: 'tagator_research_config_like', id: 32 } }).row()
    .textButton({ text: '#малострочник', payload: { cmd: 'tagator_research_config_like', id: 33 } })
    .textButton({ text: '#разнострочник', payload: { cmd: 'tagator_research_config_like', id: 34 } }).row()

    .textButton({ text: '#реал', payload: { cmd: 'tagator_research_config_like', id: 35 } })
    .textButton({ text: '#внеролевое_общение', payload: { cmd: 'tagator_research_config_like', id: 36 } }).row()
    .textButton({ text: '#литературный_стиль', payload: { cmd: 'tagator_research_config_like', id: 37 } })
    .textButton({ text: '#полурол', payload: { cmd: 'tagator_research_config_like', id: 38 } }).row()

    .textButton({ text: '#джен', payload: { cmd: 'tagator_research_config_like', id: 39 } })
    .textButton({ text: '#гет', payload: { cmd: 'tagator_research_config_like', id: 40 } })//.row()
    .textButton({ text: '#слэш', payload: { cmd: 'tagator_research_config_like', id: 41 } })
    .textButton({ text: '#фемслэш', payload: { cmd: 'tagator_research_config_like', id: 42 } }).row()

    .textButton({ text: '#актив', payload: { cmd: 'tagator_research_config_like', id: 43 } })
    .textButton({ text: '#пассив', payload: { cmd: 'tagator_research_config_like', id: 44 } })
    .textButton({ text: '#универсал', payload: { cmd: 'tagator_research_config_like', id: 45 } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'tagator_menu' } }).row()
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Настройте теги, по которым будет искать тегатор-2043`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}

export async function Tagator_Research_Config_Unlike(context: MessageContext, queryPayload: any) {
    //console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
	const banned_me = await User_Banned(context)
	if (banned_me) { return await Send_Message(context, `💔 Ваш аккаунт заблокирован обратитесь к админам для разбана`) }
	await Online_Set(context)
	const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { return }
    if (blank_check.banned) { return await Send_Message(context, `💔 Ваша анкета заблокирована из-за жалоб до разбирательств`) }
    if (user_check.tag_unlike == null) { await prisma.account.update({ where: { id: user_check.id }, data: { tag_unlike: JSON.stringify([]) } })} 
    let tag = user_check.tag_unlike != null ? JSON.parse(user_check.tag_unlike ?? []) : []
    const id_tag = queryPayload.id ? Number(queryPayload.id) : null
    const tag_sel = queryPayload.id && id_tag ? await getTagById(id_tag) : null
    if (tag_sel) { 
        if (tag.includes(id_tag)) {
            tag = tag.filter((selectedId: any) => selectedId !== id_tag);
        } else {
            tag = [...tag, id_tag];
        }
        await prisma.account.update({ where: { id: user_check.id }, data: { tag_unlike: JSON.stringify(tag) } })
    }
    let tags = ''
    for (const i of tag) {
        console.log(i)
        tags += `${await getTagById(i)} `
    }
    await Send_Message(context, `Вы выбрали следующие теги нафиг: ${tags}`)
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '#фандом', payload: { cmd: 'tagator_research_config_unlike', id: 1 } })
    .textButton({ text: '#ориджинал', payload: { cmd: 'tagator_research_config_unlike', id: 2 } }).row()

    .textButton({ text: '#научная_фантастика', payload: { cmd: 'tagator_research_config_unlike', id: 3 } })
    .textButton({ text: '#фантастика', payload: { cmd: 'tagator_research_config_unlike', id: 4 } }).row()
    .textButton({ text: '#фэнтези', payload: { cmd: 'tagator_research_config_unlike', id: 5 } })
    .textButton({ text: '#приключения', payload: { cmd: 'tagator_research_config_unlike', id: 6} })
    .textButton({ text: '#военное', payload: { cmd: 'tagator_research_config_unlike', id: 7 } }).row()
    .textButton({ text: '#историческое', payload: { cmd: 'tagator_research_config_unlike', id: 8 } })
    .textButton({ text: '#детектив', payload: { cmd: 'tagator_research_config_unlike', id: 9 } })
    .textButton({ text: '#криминал', payload: { cmd: 'tagator_research_config_unlike', id: 10 } }).row()
    .textButton({ text: '#экшен', payload: { cmd: 'tagator_research_config_unlike', id: 11 } })
    .textButton({ text: '#ужасы', payload: { cmd: 'tagator_research_config_unlike', id: 12 } })
    .textButton({ text: '#драма', payload: { cmd: 'tagator_research_config_unlike', id: 13 } })
    .textButton({ text: '#мистика', payload: { cmd: 'tagator_research_config_unlike', id: 14 } }).row()
    .textButton({ text: '#психология', payload: { cmd: 'tagator_research_config_unlike', id: 15 } })
    .textButton({ text: '#повседневность', payload: { cmd: 'tagator_research_config_unlike', id: 16 } }).row()
    .textButton({ text: '#романтика', payload: { cmd: 'tagator_research_config_unlike', id: 17 } })
    .textButton({ text: '#долговременная_игра', payload: { cmd: 'tagator_research_config_unlike', id: 18 } }).row()

    .textButton({ text: '#фурри', payload: { cmd: 'tagator_research_config_unlike', id: 19 } })
    .textButton({ text: '#омегаверс', payload: { cmd: 'tagator_research_config_unlike', id: 20 } }).row()
    .textButton({ text: '#постельные_сцены', payload: { cmd: 'tagator_research_config_unlike', id: 21 } })
    .textButton({ text: '#перепихон', payload: { cmd: 'tagator_research_config_unlike', id: 22 } }).row()

    .textButton({ text: '#14+', payload: { cmd: 'tagator_research_config_unlike', id: 23 } })
    .textButton({ text: '#16+', payload: { cmd: 'tagator_research_config_unlike', id: 24 } })//.row()
    .textButton({ text: '#18+', payload: { cmd: 'tagator_research_config_unlike', id: 25 } })
    .textButton({ text: '#18++', payload: { cmd: 'tagator_research_config_unlike', id: 26 } }).row()

    .textButton({ text: '#мск/мск-1', payload: { cmd: 'tagator_research_config_unlike', id: 27 } })
    .textButton({ text: '#мск+1/2/3', payload: { cmd: 'tagator_research_config_unlike', id: 28 } }).row()
    .textButton({ text: '#мск+4/5/6', payload: { cmd: 'tagator_research_config_unlike', id: 29 } })
    .textButton({ text: '#мск+7/8/9', payload: { cmd: 'tagator_research_config_unlike', id: 30 } }).row()

    .textButton({ text: '#многострочник', payload: { cmd: 'tagator_research_config_unlike', id: 31 } })
    .textButton({ text: '#среднестрочник', payload: { cmd: 'tagator_research_config_unlike', id: 32 } }).row()
    .textButton({ text: '#малострочник', payload: { cmd: 'tagator_research_config_unlike', id: 33 } })
    .textButton({ text: '#разнострочник', payload: { cmd: 'tagator_research_config_unlike', id: 34 } }).row()

    .textButton({ text: '#реал', payload: { cmd: 'tagator_research_config_unlike', id: 35 } })
    .textButton({ text: '#внеролевое_общение', payload: { cmd: 'tagator_research_config_unlike', id: 36 } }).row()
    .textButton({ text: '#литературный_стиль', payload: { cmd: 'tagator_research_config_unlike', id: 37 } })
    .textButton({ text: '#полурол', payload: { cmd: 'tagator_research_config_unlike', id: 38 } }).row()

    .textButton({ text: '#джен', payload: { cmd: 'tagator_research_config_unlike', id: 39 } })
    .textButton({ text: '#гет', payload: { cmd: 'tagator_research_config_unlike', id: 40 } })//.row()
    .textButton({ text: '#слэш', payload: { cmd: 'tagator_research_config_unlike', id: 41 } })
    .textButton({ text: '#фемслэш', payload: { cmd: 'tagator_research_config_unlike', id: 42 } }).row()

    .textButton({ text: '#актив', payload: { cmd: 'tagator_research_config_unlike', id: 43 } })
    .textButton({ text: '#пассив', payload: { cmd: 'tagator_research_config_unlike', id: 44 } })
    .textButton({ text: '#универсал', payload: { cmd: 'tagator_research_config_unlike', id: 45 } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'tagator_menu' } }).row()
	await Logger(`(private chat) ~ starting creation self blank by <user> №${context.chat.id}`)
    await Send_Message(context, `📎 Настройте теги, по которым не будет искать тегатор-2086`, keyboard, /*blank.photo*/)
    await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.chat.id}`)
}