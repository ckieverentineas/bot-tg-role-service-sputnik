import { MessageContext } from "puregram";
import { chat_id_system, starting_date, telegram } from "..";
import { Account } from "@prisma/client";
import prisma from "./prisma";

export async function Logger(text: String) {
    const project_name = `Sputnik TG`
    /*const options = {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };*/
    console.log(`[${project_name}] --> ${text} <-- (${new Date().toLocaleString("ru"/*, options*/)})`)
}

export async function Send_Message(message: MessageContext, text: string, keyboard?: any) {
    text = text ? text : 'invalid message'
    try {
        if (!keyboard) { await telegram.api.sendMessage({ chat_id: message.chat.id, text: `${text}` }); }
        else { await telegram.api.sendMessage({ chat_id: message.chat.id, text: `${text}`, reply_markup: keyboard }); }
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}

export async function Send_Message_NotSelf(id_target: number, text: string, keyboard?: any) {
    text = text ? text : 'invalid message'
    try {
        if (!keyboard) { await telegram.api.sendMessage({ chat_id: id_target, text: `${text}` }); }
        else { await telegram.api.sendMessage({ chat_id: id_target, text: `${text}`, reply_markup: keyboard }); }
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}

export async function Accessed(context: any) {
    const user: Account | null | undefined = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user) { return }
    const config: any = {
        "1": `user`,
        "2": `admin`,
        "3": `root`
    }
    const role = config[user.id_role.toString()]
    return role
}

export async function User_Banned(context: any) {
    const user = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user) { return false }
    if (user.banned) { return true }
    return false
}

export async function Blank_Cleaner(text: string) {
	try {
		return text.replace(/[^а-яА-Я0-9ёЁ \-+—–_•()/\\"'`«»{}[#№\]=:;.,!?...\n\r]/gi, '')
	} catch {
		return ' '
	}
}

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function Online_Set(context: any) {
    const user = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (user) {
        const user_online = await prisma.account.update({ where: { id: user.id }, data: { online: new Date() } })
        //await Logger(`(online) ~ change online from ${user.online} on ${user_online.online} for <user> №${context.senderId}`)
    }
}

export async function Worker_Checker() {
    
    await Send_Message_NotSelf(Number(chat_id_system), `✅ Все ок! ${await Up_Time()}\n🗿 Поставьте здесь свою реакцию о том, как прошел ваш день!`)
}

async function Up_Time() {
    const now = new Date();
    const diff = now.getTime() - starting_date.getTime();
    const timeUnits = [
        { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
        { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
        { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
        { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
    ];
    return `Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`
}

export async function Blank_Inactivity() {
    const datenow: any = new Date()
    const timeouter = 2592000000 //месяц
    const timeouter_warn = 2592000000-86400000 //29 дней
    await Logger(`(system) ~ starting clear blanks inactivity by <system> №0`)
    for (const blank of await prisma.blank.findMany({})) {
        const online_check = await prisma.account.findFirst({ where: { id: blank.id_account } })
        if (!online_check) { continue }
        const dateold: any = new Date(online_check.online)
        if (datenow-dateold > timeouter_warn && datenow-dateold < timeouter) {
            await Sleep(Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000)
            await Send_Message_NotSelf(Number(online_check.idvk), `⚠ Вы были оффлайн больше 29 дней, ваша анкета №${blank.id} будет снята с поиска завтра!`)
            continue
        }
        if (datenow-dateold > timeouter) {
            await Sleep(Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000)
            const blank_del = await prisma.blank.delete({ where: { id: blank.id } })
            if (!blank_del) { continue }
            await Send_Message_NotSelf(Number(online_check.idvk), `⛔ Вы были оффлайн больше месяца, ваша анкета №${blank.id} удалена! Вот ее содержание:\n\n${blank.text}\n\n⚠ Если вы все еще ищете сорола, то опубликуйте новую анкету`)
            await Send_Message_NotSelf(Number(chat_id_system), `⚠ Анкета №${blank.id} изъята из поиска из-за неактивности клиента.`)
        }
    }
    await Logger(`(system) ~ complete clear blanks inactivity by <system> №0`)
}