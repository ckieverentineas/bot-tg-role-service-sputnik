import { InlineKeyboardBuilder } from "puregram";

export const tag_list = [
    { id: 1, text: '#фандом' },
    { id: 2, text: '#ориджинал' },
    { id: 3, text: '#научная_фантастика' },
    { id: 4, text: '#фантастика' },
    { id: 5, text: '#фэнтези' },
    { id: 6, text: '#приключения' },
    { id: 7, text: '#военное' },
    { id: 8, text: '#историческое' },
    { id: 9, text: '#детектив' },
    { id: 10, text: '#криминал' },
    { id: 11, text: '#экшен' },
    { id: 12, text: '#ужасы' },
    { id: 13, text: '#драма' },
    { id: 14, text: '#мистика' },
    { id: 15, text: '#психология' },
    { id: 16, text: '#повседневность' },
    { id: 17, text: '#романтика' },
    { id: 18, text: '#долговременная_игра' },
    { id: 19, text: '#фурри' },
    { id: 20, text: '#омегаверс' },
    { id: 21, text: '#постельные_сцены' },
    { id: 22, text: '#перепихон' },
    { id: 23, text: '#14+' },
    { id: 24, text: '#16+' },
    { id: 25, text: '#18+' },
    { id: 26, text: '#18++' },
    { id: 27, text: '#мск/мск-1' },
    { id: 28, text: '#мск+1/2/3' },
    { id: 29, text: '#мск+4/5/6' },
    { id: 30, text: '#мск+7/8/9' },
    { id: 31, text: '#многострочник' },
    { id: 32, text: '#среднестрочник' },
    { id: 33, text: '#малострочник' },
    { id: 34, text: '#разнострочник' },
    { id: 35, text: '#реал' },
    { id: 36, text: '#внеролевое_общение' },
    { id: 37, text: '#литературный_стиль' },
    { id: 38, text: '#полурол' },
    { id: 39, text: '#джен' },
    { id: 40, text: '#гет' },
    { id: 41, text: '#слэш' },
    { id: 42, text: '#фемслэш' },
    { id: 43, text: '#актив' },
    { id: 44, text: '#пассив' },
    { id: 45, text: '#универсал' },
];

export async function getTagById(id: number | string): Promise<string | undefined> {
    const button = tag_list.find(button => button.id === Number(id));
    return button ? button.text : undefined;
}
export const keyboard_back = new InlineKeyboardBuilder().textButton({ text: '🚫 Назад', payload: { cmd: 'main_menu' } })
export async function getTagById_Self(id: number | string, tag_list_self: Array<number>): Promise<number | undefined> {
    const button = tag_list_self.find(button => button === Number(id));
    return button ? button : undefined;
}
export async function Keyboard_Tag_Constructor(tag: Array<number>, command: 'tagator_research_config_like' | 'tagator_research_config_unlike' | 'tagator_blank_config', command_back: 'tagator_menu' | 'main_menu' ) {
    const keyboard = new InlineKeyboardBuilder()
    .textButton({ text: `${await getTagById_Self(1, tag) ? '✅' : ''}#фандом`, payload: { cmd: `${command}`, id: 1 } })
    .textButton({ text: `${await getTagById_Self(2, tag) ? '✅' : ''}#ориджинал`, payload: { cmd: `${command}`, id: 2 } }).row()

    .textButton({ text: `${await getTagById_Self(3, tag) ? '✅' : ''}#научная_фантастика`, payload: { cmd: `${command}`, id: 3 } })
    .textButton({ text: `${await getTagById_Self(4, tag) ? '✅' : ''}#фантастика`, payload: { cmd: `${command}`, id: 4 } }).row()
    .textButton({ text: `${await getTagById_Self(5, tag) ? '✅' : ''}#фэнтези`, payload: { cmd: `${command}`, id: 5 } })
    .textButton({ text: `${await getTagById_Self(6, tag) ? '✅' : ''}#приключения`, payload: { cmd: `${command}`, id: 6} })
    .textButton({ text: `${await getTagById_Self(7, tag) ? '✅' : ''}#военное`, payload: { cmd: `${command}`, id: 7 } }).row()
    .textButton({ text: `${await getTagById_Self(8, tag) ? '✅' : ''}#историческое`, payload: { cmd: `${command}`, id: 8 } })
    .textButton({ text: `${await getTagById_Self(9, tag) ? '✅' : ''}#детектив`, payload: { cmd: `${command}`, id: 9 } })
    .textButton({ text: `${await getTagById_Self(10, tag) ? '✅' : ''}#криминал`, payload: { cmd: `${command}`, id: 10 } }).row()
    .textButton({ text: `${await getTagById_Self(11, tag) ? '✅' : ''}#экшен`, payload: { cmd: `${command}`, id: 11 } })
    .textButton({ text: `${await getTagById_Self(12, tag) ? '✅' : ''}#ужасы`, payload: { cmd: `${command}`, id: 12 } })
    .textButton({ text: `${await getTagById_Self(13, tag) ? '✅' : ''}#драма`, payload: { cmd: `${command}`, id: 13 } })
    .textButton({ text: `${await getTagById_Self(14, tag) ? '✅' : ''}#мистика`, payload: { cmd: `${command}`, id: 14 } }).row()
    .textButton({ text: `${await getTagById_Self(15, tag) ? '✅' : ''}#психология`, payload: { cmd: `${command}`, id: 15 } })
    .textButton({ text: `${await getTagById_Self(16, tag) ? '✅' : ''}#повседневность`, payload: { cmd: `${command}`, id: 16 } }).row()
    .textButton({ text: `${await getTagById_Self(17, tag) ? '✅' : ''}#романтика`, payload: { cmd: `${command}`, id: 17 } })
    .textButton({ text: `${await getTagById_Self(18, tag) ? '✅' : ''}#долговременная_игра`, payload: { cmd: `${command}`, id: 18 } }).row()

    .textButton({ text: `${await getTagById_Self(19, tag) ? '✅' : ''}#фурри`, payload: { cmd: `${command}`, id: 19 } })
    .textButton({ text: `${await getTagById_Self(20, tag) ? '✅' : ''}#омегаверс`, payload: { cmd: `${command}`, id: 20 } }).row()
    .textButton({ text: `${await getTagById_Self(21, tag) ? '✅' : ''}#постельные_сцены`, payload: { cmd: `${command}`, id: 21 } })
    .textButton({ text: `${await getTagById_Self(22, tag) ? '✅' : ''}#перепихон`, payload: { cmd: `${command}`, id: 22 } }).row()

    .textButton({ text: `${await getTagById_Self(23, tag) ? '✅' : ''}#14+`, payload: { cmd: `${command}`, id: 23 } })
    .textButton({ text: `${await getTagById_Self(24, tag) ? '✅' : ''}#16+`, payload: { cmd: `${command}`, id: 24 } })
    .textButton({ text: `${await getTagById_Self(25, tag) ? '✅' : ''}#18+`, payload: { cmd: `${command}`, id: 25 } })
    .textButton({ text: `${await getTagById_Self(26, tag) ? '✅' : ''}#18++`, payload: { cmd: `${command}`, id: 26 } }).row()

    .textButton({ text: `${await getTagById_Self(27, tag) ? '✅' : ''}#мск/мск-1`, payload: { cmd: `${command}`, id: 27 } })
    .textButton({ text: `${await getTagById_Self(28, tag) ? '✅' : ''}#мск+1/2/3`, payload: { cmd: `${command}`, id: 28 } }).row()
    .textButton({ text: `${await getTagById_Self(29, tag) ? '✅' : ''}#мск+4/5/6`, payload: { cmd: `${command}`, id: 29 } })
    .textButton({ text: `${await getTagById_Self(30, tag) ? '✅' : ''}#мск+7/8/9`, payload: { cmd: `${command}`, id: 30 } }).row()

    .textButton({ text: `${await getTagById_Self(31, tag) ? '✅' : ''}#многострочник`, payload: { cmd: `${command}`, id: 31 } })
    .textButton({ text: `${await getTagById_Self(32, tag) ? '✅' : ''}#среднестрочник`, payload: { cmd: `${command}`, id: 32 } }).row()
    .textButton({ text: `${await getTagById_Self(33, tag) ? '✅' : ''}#малострочник`, payload: { cmd: `${command}`, id: 33 } })
    .textButton({ text: `${await getTagById_Self(34, tag) ? '✅' : ''}#разнострочник`, payload: { cmd: `${command}`, id: 34 } }).row()

    .textButton({ text: `${await getTagById_Self(35, tag) ? '✅' : ''}#реал`, payload: { cmd: `${command}`, id: 35 } })
    .textButton({ text: `${await getTagById_Self(36, tag) ? '✅' : ''}#внеролевое_общение`, payload: { cmd: `${command}`, id: 36 } }).row()
    .textButton({ text: `${await getTagById_Self(37, tag) ? '✅' : ''}#литературный_стиль`, payload: { cmd: `${command}`, id: 37 } })
    .textButton({ text: `${await getTagById_Self(38, tag) ? '✅' : ''}#полурол`, payload: { cmd: `${command}`, id: 38 } }).row()

    .textButton({ text: `${await getTagById_Self(39, tag) ? '✅' : ''}#джен`, payload: { cmd: `${command}`, id: 39 } })
    .textButton({ text: `${await getTagById_Self(40, tag) ? '✅' : ''}#гет`, payload: { cmd: `${command}`, id: 40 } })
    .textButton({ text: `${await getTagById_Self(41, tag) ? '✅' : ''}#слэш`, payload: { cmd: `${command}`, id: 41 } })
    .textButton({ text: `${await getTagById_Self(42, tag) ? '✅' : ''}#фемслэш`, payload: { cmd: `${command}`, id: 42 } }).row()

    .textButton({ text: `${await getTagById_Self(43, tag) ? '✅' : ''}#актив`, payload: { cmd: `${command}`, id: 43 } })
    .textButton({ text: `${await getTagById_Self(44, tag) ? '✅' : ''}#пассив`, payload: { cmd: `${command}`, id: 44 } })
    .textButton({ text: `${await getTagById_Self(45, tag) ? '✅' : ''}#универсал`, payload: { cmd: `${command}`, id: 45 } }).row()
    .textButton({ text: '👌 Дальше', payload: { cmd: `${command_back}` } }).row()
    return keyboard
}