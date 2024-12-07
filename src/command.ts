import { HearManager } from "@puregram/hear";
import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "./module/prisma";
import { Accessed, Logger, Send_Message, Send_Message_NotSelf } from "./module/helper";
import { root } from ".";
import { Account } from "@prisma/client";

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
        InlineKeyboard.textButton({ text: '📃 Моя анкета', payload: { cmd: 'blank_self' } }),
        InlineKeyboard.textButton({ text: `${mail_check ? '📬' : '📪'} Почта`, payload: { cmd: 'mail_self' } })
      ],
      [ 
        InlineKeyboard.textButton({ text: '⚙ Цензура', payload: { cmd: 'censored_change' } }),
        InlineKeyboard.textButton({ text: '☠ Банхаммер', payload: { cmd: 'banhammer_self' } })
      ],
      [
        InlineKeyboard.textButton({ text: '🌐 Браузер', payload: { cmd: 'browser_research' } }),
        InlineKeyboard.textButton({ text: '🔍 Поиск', payload: { cmd: 'basic_research' } })
      ],
      [
        InlineKeyboard.textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } }),
        InlineKeyboard.textButton({ text: '📐 Пкметр', payload: { cmd: 'pkmetr' } })
      ],
      (user_check.donate || await Accessed(context) != `user`) ?
      [
        InlineKeyboard.textButton({ text: '🔧 Плагины', payload: { cmd: 'sub_menu' } }),
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: { cmd: 'exit' } })
      ] :
      [
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: { cmd: 'exit' } })
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
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
  hearManager.hear(/!админка/, async (context: any) => {
    if (context.chat.id == root) {
      const user:any = await prisma.account.findFirst({ where: { idvk: Number(context.chat.id) } })
      const lvlup = await prisma.account.update({ where: { id: user.id }, data: { id_role: 2 } })
      if (lvlup) {
          await Send_Message(context, `⚙ Рут права получены`)
          console.log(`Super user ${context.chat.id} got root`)
      } else {
          await Send_Message(context, `⚙ Ошибка`)
      }
    }
  })
  hearManager.hear(/!права/, async (context: MessageContext) => {
    if (context.chat.id == Number(root) || await Accessed(context) != 'user') {
      let [ command, target ] = context.text!.split(' ')
      if (typeof target != 'string') { return }
      target = target.replace('@', '')
      const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
      if (!account_check) { 
        await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			//await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { id_role: account_check.id_role == 1 ? 2 : 1 } })
      await Send_Message(context, `🔧 @${login.username} ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.id_role == 2 ? 'добавлены в лист администраторов' : 'убраны из листа администраторов'}`)
			await Logger(`(private chat) ~ changed role <${login.id_role == 2 ? 'admin' : 'user'}> for #${login.idvk} by <admin> №${context.chat.id}`)
    }
  })
}