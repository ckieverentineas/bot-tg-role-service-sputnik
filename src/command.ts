import { HearManager } from "@puregram/hear";
import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "./module/prisma";
import { Accessed, Logger, Send_Message } from "./module/helper";

export function commandUserRoutes(hearManager: HearManager<MessageContext>): void { 
  hearManager.hear(
      '/strict',
      async (context) => await context.send('triggered by a strict string')
  )
  // главное меню
  hearManager.hear(/!спутник|!Спутник/, async (context: any) => {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user_check) { return }
    //await Online_Set(context)
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    const mail_check = await prisma.mail.findFirst({ where: {  blank_to: blank_check?.id ?? 0, read: false, find: true } })
    const keyboard = InlineKeyboard.keyboard([
      [ 
        InlineKeyboard.textButton({ text: '📃 Моя анкета', payload: { command: 'blank_self' } }),
        InlineKeyboard.textButton({ text: `${mail_check ? '📬' : '📪'} Почта`, payload: { command: 'mail_self' } })
      ],
      [ 
        InlineKeyboard.textButton({ text: '⚙ Цензура', payload: { command: 'censored_change' } }),
        InlineKeyboard.textButton({ text: '☠ Банхаммер', payload: { command: 'banhammer_self' } })
      ],
      [
        InlineKeyboard.textButton({ text: '🌐 Браузер', payload: { command: 'browser_research' } }),
        InlineKeyboard.textButton({ text: '🔍 Поиск', payload: { command: 'basic_research' } })
      ],
      [
        InlineKeyboard.textButton({ text: '🎲 Рандом', payload: { command: 'random_research' } }),
        InlineKeyboard.textButton({ text: '📐 Пкметр', payload: { command: 'pkmetr' } })
      ],
      (user_check.donate || await Accessed(context) != `user`) ?
      [
        InlineKeyboard.textButton({ text: '🔧 Плагины', payload: { command: 'sub_menu' } }),
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: { command: 'exit' } })
      ] :
      [
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: { command: 'exit' } })
      ]
    ])
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}, что изволите?`, keyboard)
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
  // дополнительное меню
  hearManager.hear(/🔧 Плагины|! Плагин|!плагин/, async (context: any) => {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
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
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
}