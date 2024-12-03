import { InlineKeyboard } from "puregram";
import { users_pk } from "../..";
import { Accessed, Blank_Cleaner, Logger, Send_Message, User_Banned } from "../helper";
import prisma from "../prisma";
import { Censored_Activation_Pro } from "./censored";
import { User_Pk_Get, User_Pk_Init } from "./pk_metr";

export async function Input_Module(context: any) {
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    
    if (id == null) { return }
    //await Send_Message(context, `mode: ${users_pk[id].mode}\n operation: ${users_pk[id].operation}\n input: ${users_pk[id].text}`)
	if (context.text && typeof context.text == `string` && users_pk[id].mode == 'input') {
		users_pk[id].text = context.text
        users_pk[id].mode = 'main'
        //await Send_Message(context, `мод: ${users_pk[id].operation}\n текст: ${users_pk[id].text}`)
	} else {
        return false
    }
    const config: Record<string, Function> = {
        "blank_create_prefab_input_off": Blank_Create_Prefab_Input_Off, // 1 Анкета - Сохранение анкеты
    };
    
    const command: string | any = users_pk[id].operation;
    if (typeof command != 'string') { return }
    
    if (config.hasOwnProperty(command)) {
        try {
            await config[command](context, id);
            //await message.editMessageReplyMarkup({ inline_keyboard: [] });
        } catch (e) {
            await Logger(`Error event detected for command '${command}': ${e}`);
        }
    } else {
        await Logger(`Unknown command: '${command}'`);
    }
    return true
	//console.log(users_pk[id].text)
}

async function Blank_Create_Prefab_Input_Off(context: any, id: number) {
    console.log(context)
    const user_check = await prisma.account.findFirst({ where: { idvk: context.chat.id } })
    if (!user_check) { return }
    const banned_me = await User_Banned(context)
	if (banned_me) { return }
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (blank_check) { return }
	//await Online_Set(context)
    let text_input = await Blank_Cleaner(users_pk[id].text)
    if (text_input.length < 30) { await Send_Message(context, `Анкету от 30 символов надо!`); return }
    await Logger(`(private chat) ~ starting creation self blank by <user> №${context.senderId}`)
    await Send_Message(context, `⚠ В анкете зарегистрировано ${users_pk[id].text.length} из ${text_input.length} введенных вами символов.`)
    const save = await prisma.blank.create({ data: { text: text_input, id_account: user_check.id } })
    const keyboard = InlineKeyboard.keyboard([
        [ 
            InlineKeyboard.textButton({ text: '📃 Моя анкета', payload: 'blank_self' }),
            InlineKeyboard.textButton({ text: '🚫 Назад', payload: 'main_menu' })
        ]
      ])
	await Send_Message(context, `🔧 Вы успешно создали анкетку-конфетку под UID: ${save.id}\n${save.text}`, keyboard)
    users_pk[id].operation = ''
    users_pk[id].text = ''
}