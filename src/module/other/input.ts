import { users_pk } from "../..";
import { Send_Message } from "../helper";
import { User_Pk_Get, User_Pk_Init } from "./pk_metr";

export async function Input_Module(context: any) {
    await User_Pk_Init(context)
    const id = await User_Pk_Get(context)
    
    if (id == null) { return }
    await Send_Message(context, `mode: ${users_pk[id].mode}\n operation: ${users_pk[id].operation}\n input: ${users_pk[id].text}`)
	if (context.text && typeof context.text == `string` && users_pk[id].mode == 'input') {
		users_pk[id].text = context.text
        users_pk[id].mode = 'main'
        await Send_Message(context, `мод: ${users_pk[id].operation}\n текст: ${users_pk[id].text}`)
	} else {
        return false
    }
    return true
	//console.log(users_pk[id].text)
}