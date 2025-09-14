import { InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { 
    Accessed, 
    Blank_Vision_Activity, 
    Logger, 
    Online_Set, 
    Send_Message, 
    Send_Message_NotSelf, 
    User_Banned, 
    Verify_Blank_Not_Self, 
    Verify_User, 
    Format_Text_With_Tags, 
    Blank_Cleaner 
} from "../helper";
import { Censored_Activation_Pro } from "../other/censored";
import { telegram, users_pk } from "../..";
import { User_Pk_Get, User_Pk_Init } from "../other/pk_metr";
import { Blank } from "@prisma/client";
import { keyboard_back, getTagsForBlank } from "../datacenter/tag";
import { Researcher_Better_Blank_Target } from "./reseacher_up";

// Добавляем константы для chat_id_moderate
const chat_id_moderate = process.env.chat_id_moderate || '';

export async function Browser_Research(context: MessageContext) {
    // Проверка подписки перед началом поиска
    const isSubscribed = await checkSubscription(context.chat.id)
    if (!isSubscribed) {
        const keyboard = new InlineKeyboardBuilder()
            .urlButton({ text: '📢 Подписаться', url: 'https://t.me/sputnik_signal' })
            .textButton({ text: '🔄 Проверить подписку', payload: { cmd: 'check_subscription_browser' } })
        
        return await Send_Message(context, `⚠ Для использования браузера необходимо подписаться на наш канал: @sputnik_signal`, keyboard)
    }

    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    
    // Подготовка системы к вводу промпта для поиска
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'browser_research_prefab_input_off'
    
    await Send_Message(context, `🧷 Введите промпт для поиска анкеты от 3 до 64 символов:`)
    await Logger(`(research browser) ~ starting write prompt for browser search for @${user_check.username}`)
}

// Добавляем функцию проверки подписки
async function checkSubscription(userId: number): Promise<boolean> {
  try {
    const member = await telegram.api.getChatMember({
      chat_id: '@sputnik_signal',
      user_id: userId
    })

    return member.status !== 'left' && member.status !== 'kicked'
  } catch (error) {
    console.error(`Ошибка при проверке подписки:`, error)
    return false
  }
}

export async function Browser_Research_Prefab_Input_Off(context: any, id: number) {
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести промпт повторно', payload: { cmd: 'browser_research' } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    if (text_input.length < 3) { 
        return await Send_Message(context, `⚠ Промпт от 3 символов надо!`, keyboard_repeat); 
    }
    if (text_input.length > 64) { 
        text_input = text_input.slice(0, 64);
    }
    
    await Send_Message(context, `⌛ Ожидайте, подбираем анкеты по запросу: "${text_input}"...`)
    
    let blank_build: any[] = []
    
    for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
        if (blank.id_account == user_check.id) { continue }
        const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
        if (vision_check) { continue }
        
        const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
        const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: Number(user_bl_ch?.idvk) ?? 0 } })
        if (black_list_my) { continue }
        
        const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: Number(user_check.idvk) } })
        if (black_list_other) { continue }
        
        const result = await Researcher_Better_Blank_Target(text_input, blank);
        blank_build.push(result);
        
        blank_build.sort((a, b) => b.score - a.score)
        blank_build.length = Math.min(blank_build.length, 50);
    }
    
    if (blank_build.length === 0) {
        return await Send_Message(context, 
            `😿 Не найдено анкет по запросу: "${text_input}", попробуйте другой промпт.`, 
            keyboard_back)
    }
    
    // Сохраняем результаты поиска для пользователя
    users_pk[id].searchResults = blank_build;
    users_pk[id].searchQuery = text_input;
    users_pk[id].currentIndex = 0;
    
    // Показываем первую анкету
    const selector = blank_build[0]
    await Show_Browser_Blank(context, selector, user_check, blank_build, text_input)
    
    users_pk[id].operation = ''
    users_pk[id].text = ''
}

async function Show_Browser_Blank(context: MessageContext, selector: any, user_check: any, blank_build: any[], searchQuery: string) {
    const blank_check_notself = await prisma.blank.findFirst({ where: { id: selector.id } })
    if (!blank_check_notself) { 
        blank_build.shift()
        if (blank_build.length === 0) {
            return await Send_Message(context, `😿 Очередь анкет закончилась.`, keyboard_back)
        }
        return await Show_Browser_Blank(context, blank_build[0], user_check, blank_build, searchQuery)
    }

    let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
    
    // Подсвечиваем найденный текст
    const highlightedText = highlightText(censored, searchQuery);
    
    const baseText = `🛰️ Поисковый режим «Браузер-4000»:\n\n📜 Анкета: ${selector.id}\n🔎 Совпадение: ${(selector.score * 100).toFixed(2)}%\n💬 Содержание:\n${highlightedText}`
    const tags = await getTagsForBlank(selector.id)
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, selector.id, tags)
    
    // Используем короткий query для payload чтобы избежать BUTTON_DATA_INVALID
    const shortQuery = searchQuery.length > 30 ? searchQuery.substring(0, 30) + '...' : searchQuery;
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'browser_unlike', idb: selector.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'browser_like', idb: selector.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    if (user_check.donate == true) { 
        keyboard.textButton({ text: '✏ Письмо', payload: { cmd: 'browser_like_don', idb: selector.id } }).row() 
    } else { 
        keyboard.row() 
    }
    
    keyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'browser_report', idb: selector.id } })

    const messageText = `${text}`;
    if (messageText.length > 4000) {
        const part1 = messageText.substring(0, 4000);
        const part2 = messageText.substring(4000);
        
        // Обе части должны отправляться с HTML-парсингом
        await Send_Message(context, part1, undefined, { parse_mode: 'HTML' });
        await Send_Message(context, part2, keyboard, { parse_mode: 'HTML' });
    } else {
        await Send_Message(context, messageText, keyboard, { parse_mode: 'HTML' });
    }
            
    await Logger(`(research browser) ~ show <blank> #${selector.id} for @${user_check.username}`)
}

export async function Browser_Like(context: MessageContext, queryPayload: any) {
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    
    const blank_verify = await Verify_Blank_Not_Self(context, queryPayload.idb)
    if (!blank_verify) { return }
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    
    await Blank_Vision_Activity(context, queryPayload.idb, user_self)
    
    await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
    const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 }})
    
    if (mail_set) { 
        await Send_Message_NotSelf(Number(user_nice.idvk), `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`) 
    }
    
    await Logger(`(research browser) ~ clicked swipe <blank> #${blank_nice.id} for @${user_self.username}`)
    
    // Показываем следующую анкету из результатов поиска
    await Show_Next_Browser_Result(context, user_self)
}

export async function Browser_Unlike(context: MessageContext, queryPayload: any) {
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    
    await Blank_Vision_Activity(context, queryPayload.idb, user_self)
    
    await Send_Message(context, `✅ Пропускаем анкету #${queryPayload.idb}.`)
    await Logger(`(research browser) ~ clicked unswipe for <blank> #${queryPayload.idb} for @${user_self.username}`)
    
    // Показываем следующую анкету из результатов поиска
    await Show_Next_Browser_Result(context, user_self)
}

// Добавляем функцию для показа следующего результата
async function Show_Next_Browser_Result(context: MessageContext, user_check: any) {
    const id = await User_Pk_Get(context);
    if (id == null) { return; }
    
    // Добавьте проверки на существование свойств
    if (!users_pk[id]?.searchResults || users_pk[id].searchResults?.length === 0) {
        return await Send_Message(context, `😿 Результаты поиска закончились.`, keyboard_back);
    }
    
    users_pk[id].currentIndex = (users_pk[id].currentIndex || 0) + 1;
    
    if (users_pk[id].currentIndex >= users_pk[id].searchResults.length) {
        return await Send_Message(context, `😿 Все результаты поиска просмотрены.`, keyboard_back);
    }
    
    const nextResult = users_pk[id].searchResults[users_pk[id].currentIndex];
    if (!nextResult) {
        return await Send_Message(context, `😿 Ошибка при получении следующего результата.`, keyboard_back);
    }
    
    // Добавляем проверку на существование searchQuery
    const searchQuery = users_pk[id].searchQuery || '';
    
    await Show_Browser_Blank(context, nextResult, user_check, users_pk[id].searchResults, searchQuery)
}

export async function Browser_Report(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    
    // проверяем наличие жалобы на пользователя и его анкеты
    const blank_verify = await Verify_Blank_Not_Self(context, queryPayload.idb)
    if (!blank_verify) { return }
    const blank_report = blank_verify.blank_nice
    
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'browser_report_ION', idb: blank_report.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'browser_research' } })
    
    await Send_Message(context, `📎 Перед вводом жалобы подтвердите готовность, нажав кнопку [✏ Ввести жалобу]`, keyboard)
    await Logger(`(research browser) ~ show prefab for report on <blank> #${blank_report.id} by @${user_self.username}`)
}

export async function Browser_Report_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    
    // проверяем на попытку повторной жалобы
    const report_check = await prisma.report.findFirst({ where: { id_blank: queryPayload.idb, id_account: user_self.id }})
    if (report_check) { 
        return await Send_Message(context, `⚠ Вы уже подавали жалобу на анкету ${report_check.id_blank}`)
    }
    
    // подготовка системы к вводу данных пользователем для жалобы
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'browser_report_prefab_input_off'
    users_pk[id].id_target = queryPayload.idb
    
    await Send_Message(context, `🧷 Введите причину жалобы от 10 до 2000 символов:`)
    await Logger(`(research browser) ~ starting write report on <blank> #${queryPayload.idb} by @${user_self.username}`)
}

export async function Browser_Like_Donation_Perfab_Input_ON(context: MessageContext, queryPayload: any) {
    // верификация пользователя
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    
    // подготовка системы к вводу данных пользователем для донатного лайка
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    if (id == null) { return }
    
    users_pk[id].mode = 'input'
    users_pk[id].operation = 'browser_like_donation_prefab_input_off'
    users_pk[id].id_target = queryPayload.idb
    
    await Send_Message(context, `🧷 Введите приватное сообщение пользователю от 10 до 3000 символов:`)
    await Logger(`(research browser) ~ starting write message for donation like on <blank> #${queryPayload.idb} by @${user_self.username}`)
}

// --- новый обработчик для показа тегов в браузере ---
export async function Show_Tags_Browser(context: MessageContext, queryPayload: any) {
    const tags = await getTagsForBlank(queryPayload.idb)
    const tagsText = tags.length ? tags.map((t: any) => `#${t.name}`).join("\n") : "Тегов нет"
    
    const keyboard = new InlineKeyboardBuilder()
        .textButton({ text: "⬅ Назад к анкете", payload: { cmd: "browser_research_show_blank", idb: queryPayload.idb } })

    await Send_Message(context, `🏷 Теги анкеты #${queryPayload.idb}:\n\n${tagsText}`, keyboard)
    await Logger(`(research browser) ~ show tags for <blank> #${queryPayload.idb}`)
}

// --- функция для показа конкретной анкеты в браузере ---
export async function Browser_Research_Show_Blank(context: MessageContext, queryPayload: any) {
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
    const baseText = `🛰️ Поисковый режим «Браузер-4000»:\n\n📜 Анкета: ${blank_check_notself.id}\n💬 Содержание:\n${censored}`
    const tags = await getTagsForBlank(blank_check_notself.id)
    const { text, keyboard } = await Format_Text_With_Tags(context, baseText, blank_check_notself.id, tags)
    
    keyboard.textButton({ text: '⛔ Мимо', payload: { cmd: 'browser_unlike', idb: blank_check_notself.id } })
    .textButton({ text: `✅ Отклик`, payload: { cmd: 'browser_like', idb: blank_check_notself.id } }).row()
    .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    if (user_check.donate == true) { 
        keyboard.textButton({ text: '✏ Письмо', payload: { cmd: 'browser_like_don', idb: blank_check_notself.id } }).row() 
    } else { 
        keyboard.row() 
    }
    
    keyboard.textButton({ text: '⚠ Жалоба', payload: { cmd: 'browser_report', idb: blank_check_notself.id } })
    
    await Send_Message(context, `${text}`, keyboard)
    await Logger(`(research browser) ~ show specific <blank> #${blank_check_notself.id} for @${user_check.username}`)
}

// Добавляем недостающие функции для input.ts
export async function Browser_Report_Prefab_Input_Off(context: any, id: number) {
    // Реализация аналогичная другим report функциям
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_check = user_verify.user_check
    
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
        .textButton({ text: '✏ Ввести жалобу', payload: { cmd: 'browser_report_ION', idb: Number(users_pk[id].id_target) } }).row()
        .textButton({ text: '🚫 Назад', payload: { cmd: 'browser_research' } })
    
    if (!users_pk[id].id_target) return await Send_Message(context, `⚠ Анкета не выбрана для подачи жалобы`, keyboard_back)
    if (text_input.length < 10) return await Send_Message(context, `⚠ Жалобу от 10 символов надо!`, keyboard_repeat)
    if (text_input.length > 2000) return await Send_Message(context, `⚠ Жалобу до 2000 символов надо!`, keyboard_repeat)
    
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) return
    const user_warn = blank_verify.user_nice
    const blank_report_check = blank_verify.blank_nice
    
    const report_set = await prisma.report.create({ data: { id_blank: blank_report_check.id, id_account: user_check.id, text: text_input } })
    const counter_warn = await prisma.report.count({ where: { id_blank: blank_report_check.id, status: 'wait' } })
    
    await Send_Message_NotSelf(Number(user_warn.idvk), `✅ На вашу анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
    
    if (counter_warn >= 3) {
        await prisma.blank.update({ where: { id: blank_report_check.id }, data: { banned: true } })
        await Send_Message_NotSelf(Number(user_warn.idvk), `🚫 На вашу анкету #${blank_report_check.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
        await Send_Message_NotSelf(Number(chat_id_moderate), `⚠ Анкета #${blank_report_check.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
    }
    
    await Blank_Vision_Activity(context, blank_report_check.id, user_check)
    const keyboard = new InlineKeyboardBuilder()
        .textButton({ text: '🌐 Браузер', payload: { cmd: 'browser_research' } }).row()
        .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    await Send_Message(context, `✅ Мы зарегистрировали вашу жалобу на анкету #${blank_report_check.id}, спасибо за донос!`, keyboard)
    await Send_Message_NotSelf(Number(chat_id_moderate), `🧨 На анкету #${blank_report_check.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
    
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(browser researcher) ~ report on <blank> #${blank_report_check.id} by @${user_check.username}`)
}

export async function Browser_Like_Donation_Prefab_Input_Off(context: any, id: number) {
    const user_verify = await Verify_User(context)
    if (!user_verify) { return }
    const user_self = user_verify.user_check
    const blank_self = user_verify.blank_check
    
    let text_input = await Blank_Cleaner(users_pk[id].text)
    const keyboard_repeat = new InlineKeyboardBuilder()
        .textButton({ text: '✏ Письмо повторно', payload: { cmd: 'browser_like_don', idb: Number(users_pk[id].id_target) } }).row()
        .textButton({ text: '🚫 Назад', payload: { cmd: 'browser_research' } })
    
    if (!users_pk[id].id_target) return await Send_Message(context, `⚠ Анкета не выбрана для жирного лайка`, keyboard_back)
    if (text_input.length < 10) return await Send_Message(context, `⚠ Сообщение от 10 символов надо!`, keyboard_repeat)
    if (text_input.length > 3000) return await Send_Message(context, `⚠ Сообщение до 3000 символов надо!`, keyboard_repeat)
    
    const blank_verify = await Verify_Blank_Not_Self(context, Number(users_pk[id].id_target))
    if (!blank_verify) return
    const user_nice = blank_verify.user_nice
    const blank_nice = blank_verify.blank_nice
    
    await Blank_Vision_Activity(context, blank_nice.id, user_self)
    
    const mail_set = await prisma.mail.create({ data: { blank_to: blank_nice.id ?? 0, blank_from: blank_self.id ?? 0 } })
    await Send_Message_NotSelf(Number(user_nice.idvk), `🔔 Ваша анкета #${blank_nice.id} понравилась кому-то, загляните в почту.`)
    await Send_Message_NotSelf(Number(user_nice.idvk), `✉️ Получено приватное письмо от владельца анкеты #${blank_self.id}: ${text_input}\n⚠ Чтобы отреагировать, загляните в почту и найдите анкету #${blank_self.id}.`)
    await Send_Message_NotSelf(Number(chat_id_moderate), `⚖️ #${blank_self.id} --> ${text_input} --> #${blank_nice.id}`)
    
    const keyboard = new InlineKeyboardBuilder()
        .textButton({ text: '🧭 Браузер', payload: { cmd: 'browser_research' } }).row()
        .textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    
    await Send_Message(context, `✅ Анкета #${blank_nice.id} вам зашла, отправляем информацию об этом его/её владельцу вместе с приложением: ${text_input}`, keyboard)
    
    users_pk[id].operation = ''
    users_pk[id].text = ''
    users_pk[id].id_target = null
    await Logger(`(browser researcher) ~ swipe like with message for <blank> #${blank_nice.id} by @${user_self.username}`)
}

// Исправленная функция для подсветки найденного текста
function highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    
    // Экранируем специальные символы в поисковом запросе для использования в регулярном выражении
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Создаем регулярное Авыражение для поиска (без учета регистра)
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    
    // Экранируем весь текст кроме совпадений
    const escapedText = (text);
    
    // Используем HTML форматирование вместо MarkdownV2
    return escapedText.replace(regex, '<b>$1</b>');
}