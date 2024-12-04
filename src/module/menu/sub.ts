import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message } from "../helper";

export async function Sub_Menu(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    //await Online_Set(context)
    const keyboard = InlineKeyboard.keyboard([
      [ 
        InlineKeyboard.textButton({ text: '⚰ Архив', payload: { cmd: 'archive_self' } }),
        InlineKeyboard.textButton({ text: `🎯 Снайпер`, payload: { cmd: 'sniper_self' } })
      ],
      (await Accessed(context) != `user`) ?
      [
        InlineKeyboard.textButton({ text: '⚖ Модерация', payload: { cmd: 'moderation_mode' } }),
        InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
      ] :
      [
        InlineKeyboard.textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
      ]
    ])
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}. Добро пожаловать в меню расширенного функционала!`, keyboard)
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.chat.id}`)
}