import { InlineKeyboardBuilder } from "puregram"
import { Accessed, Logger, Online_Set, Send_Message } from "../helper"
import prisma from "../prisma"

export async function List_Admin(context: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    await Online_Set(context)
    if (await Accessed(context) == `user`) { return }
    let puller = '🏦 Полный спектр рабов... \n'
    const usersr = await prisma.account.findMany({ where: { id_role: { not: 1 } } })
    for (const i in usersr) { puller += `\n😎 ${usersr[i].id} - @${usersr[i].username}` }
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `${puller}`, keyboard)
    await Logger(`(statistics) ~ show <info> about list admins for @${user_check.username}`)
}

export async function List_Donate(context: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    await Online_Set(context)
    if (await Accessed(context) == `user`) { return }
    let puller = '🏦 Полный спектр благодетелей... \n'
    const usersr = await prisma.account.findMany({ where: { donate: true } })
    for (const i in usersr) { puller += `\n💰 ${usersr[i].id} - @${usersr[i].username}` }
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `${puller}`, keyboard)
    await Logger(`(statistics) ~ show <info> about list donate users for @${user_check.username}`)
}

export async function List_Ban(context: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    await Online_Set(context)
    if (await Accessed(context) == `user`) { return }
    let puller = '🏦 Полный спектр наказанных... \n'
    const usersr = await prisma.account.findMany({ where: { banned: true } })
    for (const i in usersr) { puller += `\n☠ ${usersr[i].id} - @${usersr[i].username}` }
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `${puller}`, keyboard)
    await Logger(`(statistics) ~ show <info> about ban users for @${user_check.username}`)
}

export async function List_Banhammer(context: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    await Online_Set(context)
    let puller = '🏦 Полный спектр врагов... \n'
    const usersr = await prisma.blackList.findMany({ where: { id_account: user_check.id } })
    for (const i in usersr) { 
        const user_enemy = await prisma.account.findFirst({ where: { idvk: Number(usersr[i].idvk) } })
        puller += `\n💀 ${user_enemy?.id} - @${user_enemy?.username}` }
    const keyboard = new InlineKeyboardBuilder().textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
    await Send_Message(context, `${puller}`, keyboard)
    await Logger(`(statistics) ~ show <info> about list banhammer for @${user_check.username}`)
}