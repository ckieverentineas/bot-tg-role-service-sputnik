import { InlineKeyboard, MessageContext } from "puregram";
import prisma from "../prisma";
import { Accessed, Logger, Send_Message } from "../helper";

export async function Main_Menu(context: MessageContext) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    //await Online_Set(context)
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    const mail_check = await prisma.mail.findFirst({ where: {  blank_to: blank_check?.id ?? 0, read: false, find: true } })
    const keyboard = InlineKeyboard.keyboard([
      [ 
        InlineKeyboard.textButton({ text: '📃 Моя анкета', payload: 'blank_self' }),
        InlineKeyboard.textButton({ text: `${mail_check ? '📬' : '📪'} Почта`, payload: 'mail_self' })
      ],
      [ 
        InlineKeyboard.textButton({ text: '⚙ Цензура', payload: 'censored_change' }),
        InlineKeyboard.textButton({ text: '☠ Банхаммер', payload: 'banhammer_self' })
      ],
      [
        InlineKeyboard.textButton({ text: '🌐 Браузер', payload: 'browser_research' }),
        InlineKeyboard.textButton({ text: '🔍 Поиск', payload: 'basic_research' })
      ],
      [
        InlineKeyboard.textButton({ text: '🎲 Рандом', payload: 'random_research' }),
        InlineKeyboard.textButton({ text: '📐 Пкметр', payload: 'pkmetr' })
      ],
      (user_check.donate || await Accessed(context) != `user`) ?
      [
        InlineKeyboard.textButton({ text: '🔧 Плагины', payload: 'sub_menu' }),
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: 'exit' })
      ] :
      [
        InlineKeyboard.textButton({ text: '🚫 Каеф', payload: 'exit' })
      ]
    ])
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}, что изволите?`, keyboard)
    await Logger(`SSL(private chat) ~ enter in main menu system is viewed by <user> №${context.chat.id}`)
}