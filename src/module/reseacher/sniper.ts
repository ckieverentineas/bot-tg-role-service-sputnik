import { MessageContext } from "puregram"
import prisma from "../prisma"
import { Accessed, Logger, Online_Set, Send_Message, User_Banned, Verify_User, Format_Text_With_Tags } from "../helper"
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr"
import { users_pk } from "../.."
import { getTagsForBlank, keyboard_back } from "../datacenter/tag" // Импортируем keyboard_back
import { InlineKeyboardBuilder } from "puregram"

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

// --- новый обработчик для показа тегов в снайперском режиме ---
export async function Show_Tags_Sniper(context: MessageContext, queryPayload: any) {
    const tags = await getTagsForBlank(queryPayload.idb)
    const tagsText = tags.length ? tags.map((t: {name: string}) => `#${t.name}`).join("\n") : "Тегов нет"
    
    const keyboard = new InlineKeyboardBuilder()
        // Исправлено: используем правильную команду для возврата к анкете
        .textButton({ text: "⬅ Назад к анкете", payload: { cmd: "sniper_research_show_blank", idb: queryPayload.idb } })

    await Send_Message(context, `🏷 Теги анкеты #${queryPayload.idb}:\n\n${tagsText}`, keyboard)
    await Logger(`(research sniper) ~ show tags for <blank> #${queryPayload.idb}`)
}

// Заменяем старую логику отображения тегов на новую систему
export async function Sniper_Research_Show_Blank(context: MessageContext, queryPayload: any) {
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

    // Используем новую систему форматирования с тегами
    const baseText = `🛰️ Поисковый режим «Снайпер-0000»:\n\n📜 Анкета: ${blank_check_notself.id}\n💬 Содержание:\n${blank_check_notself.text}`
    const tags = await getTagsForBlank(blank_check_notself.id)
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, blank_check_notself.id, tags)
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'blank_unlike', idb: blank_check_notself.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'blank_like', idb: blank_check_notself.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'sniper_research' } })
    
    if (user_check.donate == true) { 
        keyboard.textButton({ text: '✏ Письмо', payload: { cmd: 'blank_like_don', idb: blank_check_notself.id  } }).row() 
    } else { 
        keyboard.row() 
    }
    
    keyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'blank_report', idb: blank_check_notself.id } })
    
    await Send_Message(context, `${text}`, keyboard)
    await Logger(`(research sniper) ~ show specific <blank> #${blank_check_notself.id} for @${user_check.username}`)
}