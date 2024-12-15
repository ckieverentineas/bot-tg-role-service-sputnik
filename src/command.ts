import { HearManager } from "@puregram/hear";
import { InlineKeyboard, InlineKeyboardBuilder, KeyboardBuilder, MediaSourceType, MessageContext} from "puregram";
import prisma from "./module/prisma";
import { Accessed, Logger, Online_Set, Send_Message, Send_Message_NotSelf } from "./module/helper";
import { chat_id_moderate, chat_id_system, root, telegram } from ".";
import { Account } from "@prisma/client";

export function commandUserRoutes(hearManager: HearManager<MessageContext>): void { 
  hearManager.hear(/!Клава|!клава|\/keyboard/, async (context: any) => {
    if (context.chat.id < 0) { return }
    const keyboard = new KeyboardBuilder().textButton('!спутник')
    .textButton(`!пкметр`).resize()
    //await telegram.api.sendMessage({ chat_id: context.chat.id, text: `Емаа Клава Кока подьехала`, reply_markup: keyboard })
    /*.then(async (response: any) => { 
        console.log(response)
        await Sleep(10000)
        return await telegram.api.deleteMessage({ chat_id: response.chat.id, message_id: response.message_id }) })
    .then(async () => { await Logger(`(private chat) ~ succes get keyboard is viewed by <user> №${context.senderId}`) })
    .catch((error) => { console.error(`User ${context.senderId} fail get keyboard: ${error}`) });*/
    await Send_Message(context, `🛰 Выдали для вас клавиатуру, ${context.chat.firstName}`, keyboard)
    await Logger(`(command center) ~ show keyboard for @${context.chat.id}`)
  })
  // главное меню
  hearManager.hear(/!спутник|!Спутник|\/sputnik/, async (context: any) => {
    if (context.chat.id < 0) { return }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    await Online_Set(context)
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
    const mail_check = await prisma.mail.findFirst({ where: {  blank_to: blank_check?.id ?? 0, read: false, find: true } })
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: '📃 Моя анкета', payload: { cmd: 'blank_self' } })
    .textButton({ text: `${mail_check ? '📬' : '📪'} Почта`, payload: { cmd: 'mail_self' } }).row()
    .textButton({ text: '⚙ Цензура', payload: { cmd: 'censored_change' } })
    .textButton({ text: '🌐 Тегатор', payload: { cmd: 'tagator_menu' } }).row()
    .textButton({ text: '🎲 Рандом', payload: { cmd: 'random_research' } })
    .textButton({ text: '🚫 Каеф', payload: { cmd: 'exit_menu' } }).row()
    if (user_check.donate || await Accessed(context) != `user`) {
      keyboard.textButton({ text: '⚰ Архив', payload: { cmd: 'archive_research' } })
      .textButton({ text: `🎯 Снайпер`, payload: { cmd: 'sniper_research' } }).row()
    }
    if (await Accessed(context) != `user`) {
      keyboard.textButton({ text: '⚖ Модерация', payload: { cmd: 'moderate_self' } })
      keyboard.textButton({ text: '📊 Забаненные', payload: { cmd: 'list_ban' } }).row()
      keyboard.textButton({ text: '📊 Донатеры', payload: { cmd: 'list_donate' } })
      keyboard.textButton({ text: '📊 Админы', payload: { cmd: 'list_admin' } }).row()
    }
    keyboard.textButton({ text: '📊 Список ЧС', payload: { cmd: 'list_banhammer' } })
    keyboard.urlButton({ text: '🔍 Найти в ВК', url: 'https://vk.com/sputnikbot' })
    await Send_Message(context, `🛰 Вы в системе поиска соролевиков, ${context.chat.firstName}, что изволите?`, keyboard)
    await Logger(`(command center) ~ show main menu for @${context.chat.id}`)
  })
  // только для рут пользователя, выдача админки
  hearManager.hear(/!админка/, async (context: any) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == root) {
      const user:any = await prisma.account.findFirst({ where: { idvk: Number(context.chat.id) } })
      const lvlup = await prisma.account.update({ where: { id: user.id }, data: { id_role: 2 } })
      if (lvlup) {
          await Send_Message(context, `⚙ Рут права получены`)
          await Send_Message_NotSelf(Number(chat_id_moderate), `🔧 Super user @${lvlup.username} got root`)
          await Logger(`(command center) ~ root user access for @${context.chat.id}`)
      } else {
          await Send_Message(context, `⚙ Ошибка`)
      }
    }
  })
  // только для рут пользователя, выдача админки
  hearManager.hear(/!помощь|\/help/, async (context: any) => {
    if (context.chat.id < 0) { return }
    await Online_Set(context)
    await Send_Message(context, 
    `📄 Основные правила: без нарушений законодательства, пиара, пошлости, грязи и флуда в анкетах.
    \n☠ Команды бота:
    \n👤 !пкметр — функция быстрого подсчета компьютерных и мобильных строк, символов, предложений, лимитов в ролевом посте;
    \n👤 !чс @username — где username — уникальный адрес пользователя в тг, добавляет/убирает из черного списка в Спутнике. Если вы или вас добавили в чс, то анкету своего недруга вы не встретите, а вашу анкету не увидит данный игрок;
    \n👥 !права @username — где username — уникальный адрес пользователя в тг, добавляет/убирает из списка администраторов в Спутнике;
    \n👥 !донатер @username — где username — уникальный адрес пользователя в тг, добавляет/убирает из списка донатеров в Спутнике;
    \n👥 !бан @username — где username — уникальный адрес пользователя в тг, добавляет/удаляет в бан Спутника для приостановки доступа.
    \n⚠ Команды с символами:\n👤 — Доступны обычным пользователям;\n👥 — Доступны администраторам бота.
    \n🔍 Режимы поиска:
    \n🎲 Рандом — совершенно случайные анкеты;
    \n🌐 Тегатор — настройте теги в своей анкете, и её смогут найти другие пользователи! Обратите внимание, что теги не следует указывать в тексте анкеты, их нужно настроить отдельно. Для того чтобы воспользоваться тегатором, выберите подходящие теги, исключите неподходящие и нажмите «Поехали»;
    \n⚰ Архив — уже просмотренные случайные анкеты. Режим входит в расширенный функционал и доступен донам;
    \n🎯 Снайпер — моментальный поиск анкеты по её номеру, в обход черного и просмотренного списков. Режим входит в расширенный функционал и доступен донам.
    \n@space_feedback — связь с создателями Спутника, флуд-чат, участие в тестированиях, возможность найти автора мисскликнутой анкеты. Просьба давать обратную связь только тут, а не ломиться в личку разработчикам.
    \n@beskoletov — по вопросам разбана и получения доступа к расширенному функционалу: еще двум режимам поиска в Спутнике, а также возможности отправить сообщение вместе с лайком.
    \n@poiskcorola — лучший тг канал, в котором вы можете найти сорола.
    `)
    await Logger(`(command center) ~ show help panel for @${context.chat.id}`)
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
        await Logger(`(command center) ~ not found <user> #${target} by <admin> №${context.chat.id}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { id_role: account_check.id_role == 1 ? 2 : 1 } })
      await Send_Message(context, `🔧 @${login.username} ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.id_role == 2 ? 'добавлены в лист администраторов' : 'убраны из листа администраторов'}`)
      await Send_Message_NotSelf(Number(chat_id_moderate), `🔧 @${login.username} ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
      await Logger(`(command center) ~ changed role <${login.id_role == 2 ? 'admin' : 'user'}> for #${login.idvk} by <admin> №${context.chat.id}`)
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
        await Logger(`(command center) ~ not found <user> #${target} by <admin> №${context.chat.id}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { banned: account_check.banned ? false : true } })
      await Send_Message(context, `🔧 @${login.username} ${login.banned ? 'добавлен в лист забаненных' : 'убран из листа забаненных'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.banned ? 'добавлены в лист забаненных' : 'убраны из листа забаненных'}`)
      await Send_Message_NotSelf(Number(chat_id_moderate), `🔧 @${login.username} ${login.banned ? 'добавлен в лист забаненных' : 'убран из листа забаненных'}`)
      await Logger(`(command center) ~ banned status changed <${login.banned ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.chat.id}`)
      const blank_block = await prisma.blank.findFirst({ where: { id_account: login.id } })
      if (!blank_block) { return await Send_Message(context, `⌛ У ролевика не было анкеты!`)}
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
      await Logger(`(command center) ~ not found <user> #${target} by №${context.chat.id}`)
      return Send_Message(context, `🔧 К сожалению, ролевик @${target} еще не успел зарегистрироваться в Спутнике, приведите недруга к нам и сделайте это!`);
    }
		await Online_Set(context)
    //проверка на наличие врага в черном списке
    const black_list_ch = await prisma.blackList.findFirst({ where: { id_account: account_self.id, idvk: account_check.idvk } })
    if (black_list_ch) { 
      const keyboard = new InlineKeyboardBuilder()
      .textButton({ text: '📃 Амнистия', payload: { cmd: 'unbanhammer', idb:  black_list_ch.id } })
      return await Send_Message(context, `⚠ К сожалению, ролевик @${account_check.username} уже в вашем черном списке. Как бы ни хотелось, но дважды и более подряд в ЧС не добавишь!`, keyboard); 
    }
    //добавление в черный список
    const blacklist_save = await prisma.blackList.create({ data: { idvk: Number(account_check.idvk), id_account: account_self.id } })
    if (!blacklist_save) { return }
    await Logger(`(command center) ~ added new person BL: ${blacklist_save.id}-${blacklist_save.idvk} by №${context.chat.id}`)
    await context.send(`🔧 Вы добавили в черный список ролевика @${account_check.username}`)
  })

  hearManager.hear(/!донатер/, async (context: MessageContext) => {
    if (context.chat.id < 0) { return }
    if (context.chat.id == Number(root) || await Accessed(context) != 'user') {
      let [ command, target ] = context.text!.split(' ')
      if (typeof target != 'string') { return }
      target = target.replace('@', '')
      const account_check: Account | null = await prisma.account.findFirst({ where: { username: target } })
      if (!account_check) { 
        await Logger(`(command center) ~ not found <user> #${target} by <admin> №${context.chat.id}`)
        return Send_Message(context, `🔧 @${target} не существует`);
      }
			await Online_Set(context)
      const login = await prisma.account.update({ where: { id: account_check.id }, data: { donate: account_check.donate ? false : true } })
      await Send_Message(context, `🔧 @${login.username} ${login.donate ? 'добавлен в лист донатеров' : 'убран из листа донатеров'}`)
			await Send_Message_NotSelf( Number(login.idvk), `🔧 Вы ${login.donate ? 'добавлены в лист донатеров' : 'убраны из листа донатеров'}`)
      await Send_Message_NotSelf(Number(chat_id_moderate), `🔧 @${login.username} ${login.donate ? 'добавлен в лист донатеров' : 'убран из листа донатеров'}`)
      await Logger(`(command center) ~ donate status changed <${login.donate ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.chat.id}`)
    }
  })
  /*
  hearManager.hear(/!фото/, async (context: any) => {
    console.log(context)
    if (context.chat.id < 0) { return }
    const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user_check) { return }
    await Online_Set(context)
    await telegram.api.sendPhoto({ chat_id: context.chat.id, photo: context!.attachment.bigSize.fileId, caption: `Здесь мог быть тройничок`})
    await telegram.api.sendPhoto({ chat_id: String(chat_id_moderate), photo: context!.attachment.bigSize.fileId, caption: `Здесь мог быть тройничок`})
   //await context.sendPhoto(`${}`)

    await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
  })
  */

  hearManager.hear(/!енотик/, async (context: MessageContext) => {
		if (context.chat.id < 0) { return }
		const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
		if (!user_check) { return }
    if (context.chat.id != Number(root) && user_check.id_role != 2) { return }
		await Online_Set(context)
    await telegram.api.sendDocument( {chat_id: context.chat.id, document: {value: './prisma/sputnik-tg.db', type: MediaSourceType.Path }, caption: '💡 Открывать на сайте: https://sqliteonline.com/' } );
    await Send_Message_NotSelf(Number(chat_id_system), `‼ @${user_check.username}(Admin) делает бекап баз данных dev.db.`)
    await Logger(`(command center) ~ did backup database by <admin> №${context.chat.id}`)
    })
}