import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message } from "../helper";

export async function Sub_Menu(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    //await Online_Set(context)
    const keyboard = InlineKeyboard.keyboard([
      [ 
        InlineKeyboard.textButton({ text: '⚰ Архив', payload: { command: 'archive_self' } }),
        InlineKeyboard.textButton({ text: `🎯 Снайпер`, payload: { command: 'sniper_self' } })
      ],
      (await Accessed(context) != `user`) ?
      [
        InlineKeyboard.textButton({ text: '⚖ Модерация', payload: { command: 'moderation_mode' } }),
        InlineKeyboard.textButton({ text: '🚫 Назад', payload: { command: 'main_menu' } })
      ] :
      [
        InlineKeyboard.textButton({ text: '🚫 Назад', payload: { command: 'main_menu' } })
      ]
    ])
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}. Добро пожаловать в меню расширенного функционала!`, keyboard)
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.chat.id}`)
}