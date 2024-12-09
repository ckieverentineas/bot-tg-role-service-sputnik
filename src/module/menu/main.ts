import { InlineKeyboard, InlineKeyboardBuilder, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message } from "../helper";

export async function Main_Menu(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    //await Online_Set(context)
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    const mail_check = await prisma.mail.findFirst({ where: {  blank_to: blank_check?.id ?? 0, read: false, find: true } })
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '📃 Моя анкета', payload: { cmd: 'blank_self' } })
    .textButton({ text: `${mail_check ? '📬' : '📪'} Почта`, payload: { cmd: 'mail_self' } }).row()
    .textButton({ text: '⚙ Цензура', payload: { cmd: 'censored_change' } })
    .textButton({ text: '🛠🌐 Тегатор', payload: { cmd: 'browser_research' } }).row()
    .textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } })
    .textButton({ text: '🚫 Каеф', payload: { cmd: 'exit' } }).row()
    if (user_check.donate || await Accessed(context) != `user`) {
      keyboard.textButton({ text: '⚰ Архив', payload: { cmd: 'archive_self' } })
      .textButton({ text: `🎯 Снайпер`, payload: { cmd: 'sniper_self' } }).row()
      .textButton({ text: '⚖ Модерация', payload: { cmd: 'moderation_mode' } })
    }
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}, что изволите?`, keyboard)
    await Logger(`SSL(private chat) ~ enter in main menu system is viewed by <user> №${context.chat.id}`)
}