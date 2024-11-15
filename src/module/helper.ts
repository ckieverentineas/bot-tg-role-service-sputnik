import { MessageContext } from "puregram";
import { telegram } from "..";

export async function Logger(text: String) {
    const project_name = `Sputnik TG`
    /*const options = {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };*/
    console.log(`[${project_name}] --> ${text} <-- (${new Date().toLocaleString("ru"/*, options*/)})`)
}

export async function Send_Message(message: MessageContext, text: string, keyboard?: any) {
    text = text ? text : 'invalid message'
    try {
        if (!keyboard) { await telegram.api.sendMessage({ chat_id: message.chat.id, text: `${text}` }); }
        else { await telegram.api.sendMessage({ chat_id: message.chat.id, text: `${text}`, reply_markup: keyboard }); }
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}