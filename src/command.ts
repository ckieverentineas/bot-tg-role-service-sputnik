import { HearManager } from "@puregram/hear";
import { InlineKeyboard, InlineKeyboardBuilder, KeyboardBuilder, MessageContext } from "puregram";
import prisma from "./module/prisma";
import { Accessed, Logger, Online_Set, Send_Message, Send_Message_NotSelf } from "./module/helper";
import { root } from ".";
import { Account } from "@prisma/client";

export function commandUserRoutes(hearManager: HearManager<MessageContext>): void { 
  hearManager.hear(/!Клава|!клава|\/keyboard/, async (context: any) => {
    if (context.chat.id < 0) { return }
    const keyboard = new KeyboardBuilder().textButton('!спутник' )
    .textButton(`!пкметр`).resize()
    //await telegram.api.sendMessage({ chat_id: context.chat.id, text: `Емаа Клава Кока подьехала`, reply_markup: keyboard })
    /*.then(async (response: any) => { 
        console.log(response)
        await Sleep(10000)
        return await telegram.api.deleteMessage({ chat_id: response.chat.id, message_id: response.message_id }) })
    .then(async () => { await Logger(`(private chat) ~ succes get keyboard is viewed by <user> №${context.senderId}`) })
    .catch((error) => { console.error(`User ${context.senderId} fail get keyboard: ${error}`) });*/
    await Send_Message(context, `🛰 Выдали для вас клавиатуру, ${context.chat.firstName}`, keyboard)
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
  // главное меню
  hearManager.hear(/!спутник|!Спутник|\/sputnik/, async (context: any) => {
    if (context.chat.id < 0) { return }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user_check) { return }
    await Online_Set(context)
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
      keyboard.textButton({ text: '⚰ Архив', payload: { cmd: 'archive_research' } })
      .textButton({ text: `🎯 Снайпер`, payload: { cmd: 'sniper_research' } }).row()
    }
    if (await Accessed(context) != `user`) {
      keyboard.textButton({ text: '⚖ Модерация', payload: { cmd: 'moderation_mode' } })
      keyboard.textButton({ text: '📊 Забаненные', payload: { cmd: 'list_ban' } }).row()
      keyboard.textButton({ text: '📊 Донатеры', payload: { cmd: 'list_donate' } })
      keyboard.textButton({ text: '📊 Админы', payload: { cmd: 'list_admin' } }).row()
    }
    keyboard.textButton({ text: '📊 Список ЧС', payload: { cmd: 'list_banhammer' } })
    keyboard.urlButton({ text: '🔍 Найти в ВК', url: 'https://vk.com/sputnikbot' })
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}, что изволите?`, keyboard)
    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
  // только для рут пользователя, выдача админки
  hearManager.hear(/!админка/, async (context: any) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == root) {
      const user:any = await prisma.account.findFirst({ where: { idvk: Number(context.chat.id) } })
      const lvlup = await prisma.account.update({ where: { id: user.id }, data: { id_role: 2 } })
      if (lvlup) {
          await Send_Message(context, `⚙ Рут права получены`)
          await Logger(`Super user ${context.chat.id} got root`)
      } else {
          await Send_Message(context, `⚙ Ошибка`)
      }
    }
  })
  // только для рут пользователя, выдача админки
  hearManager.hear(/!помощь|\/help/, async (context: any) => {
    if (context.chat.id < 0) { return }
    await Online_Set(context)
    await Send_Message(context, `☠ Команды бота уже сделанные:
    \n👤 !бонькхаммер @username - где username уникальный адрес пользователя в тг, добавляет/убирает из черного списка в Спутнике;
    \n👥 !права @username - где username уникальный адрес пользователя в тг, добавляет/убирает из списка администраторов в Спутнике;
    \n👥 !донатер @username - где username уникальный адрес пользователя в тг, добавляет/убирает из списка донатеров в Спутнике;
    \n👥 !бан @username - где username уникальный адрес пользователя в тг, добавляет/удаляет в бан Спутника для приостановки доступа.
    \n⚠ Команды с символами:\n👤 - Доступны обычным пользователям;\n👥 - Доступны администраторам бота;`)
    await Logger(`Super help ${context.chat.id} got root`)
  })
  // выдача админ прав админами пользователям
  hearManager.hear(/!права/, async (context: MessageContext) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == Number(root) || await Accessed(context) != 'user') {
      let [ command, target ] = context.text!.split(' ')
      if (typeof target != 'string') { return }
      target = target.replace('@', '')
      const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
      if (!account_check) { 
        await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { id_role: account_check.id_role == 1 ? 2 : 1 } })
      await Send_Message(context, `🔧 @${login.username} ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.id_role == 2 ? 'добавлены в лист администраторов' : 'убраны из листа администраторов'}`)
			await Logger(`(private chat) ~ changed role <${login.id_role == 2 ? 'admin' : 'user'}> for #${login.idvk} by <admin> №${context.chat.id}`)
    }
  })

  hearManager.hear(/!бан/, async (context: MessageContext) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == Number(root) || await Accessed(context) != 'user') {
      let [ command, target ] = context.text!.split(' ')
      if (typeof target != 'string') { return }
      target = target.replace('@', '')
      const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
      if (!account_check) { 
        await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { banned: account_check.banned ? false : true } })
      await Send_Message(context, `🔧 @${login.username} ${login.banned ? 'добавлен в лист забаненных' : 'убран из листа забаненных'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.banned ? 'добавлены в лист забаненных' : 'убраны из листа забаненных'}`)
			await Logger(`(private chat) ~ banned status changed <${login.banned ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.chat.id}`)
      const blank_block = await prisma.blank.findFirst({ where: { id_account: login.id } })
      if (!blank_block) { return await Send_Message(context, `⌛ У ламината не было анкеты!`)}
      const blank_del = await prisma.blank.delete({ where: { id: blank_block.id } })
      await Send_Message(context, `🔧 Анкета ${blank_del.id} владельца @${login.username} была удалена:\n ${blank_del.text}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Ваша анкета ${blank_del.id} была удалена:\n ${blank_del.text}`)
    }
  })
  hearManager.hear(/!бонькхаммер|!чс/, async (context: MessageContext) => {
    if (context.chat.id < 0) { return }
    const account_self:any = await prisma.account.findFirst({ where: { idvk: Number(context.chat.id) } })
    if (!account_self) { return }
    let [ command, target ] = context.text!.split(' ')
    if (typeof target != 'string') { return }
    target = target.replace('@', '')
    const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
    if (!account_check) { 
      await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
      return Send_Message(context, `🔧 @${target} не существует`);
    }
		await Online_Set(context)
    //проверка на наличие врага в черном списке
    const black_list_ch = await prisma.blackList.findFirst({ where: { id_account: account_self.id, idvk: account_check.idvk } })
    if (black_list_ch) { 
      const keyboard = new InlineKeyboardBuilder()
      .textButton({ text: '📃 Амнистия', payload: { cmd: 'unbanhammer', idb:  black_list_ch.id } })
      return await Send_Message(context, `⚠ К сожалению, пользователь @${account_check.username} уже в вашем черном списке. Как бы ни хотелось, но дважды и более подряд в ЧС не добавишь!`, keyboard); 
    }
    //добавление в черный список
    const blacklist_save = await prisma.blackList.create({ data: { idvk: Number(account_check.idvk), id_account: account_self.id } })
    if (!blacklist_save) { return }
    await Logger(`In database, added new person BL: ${blacklist_save.id}-${blacklist_save.idvk} by admin ${context.senderId}`)
    await context.send(`🔧 Вы добавили в черный список пользователя @${account_check.username}`)
  })

  hearManager.hear(/!донатер/, async (context: MessageContext) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == Number(root) || await Accessed(context) != 'user') {
      let [ command, target ] = context.text!.split(' ')
      if (typeof target != 'string') { return }
      target = target.replace('@', '')
      const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
      if (!account_check) { 
        await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { donate: account_check.donate ? false : true } })
      await Send_Message(context, `🔧 @${login.username} ${login.donate ? 'добавлен в лист донатеров' : 'убран из листа донатеров'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.donate ? 'добавлены в лист донатеров' : 'убраны из листа донатеров'}`)
			await Logger(`(private chat) ~ donate status changed <${login.donate ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.chat.id}`)
    }
  })
}