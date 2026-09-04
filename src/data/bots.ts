export interface Bot {
  name: string;
  what: string;
  who: string;
}

// «Ещё боты» — one line per bot that does not need a page of its own (spec §3.2).
export const bots: Bot[] = [
  { name: 'Транскрибатор', what: 'превращает голосовые и аудио в текст', who: 'для тех, кому пишут голосовыми' },
  { name: 'Парсер объявлений', what: 'присылает новые объявления по фильтрам', who: 'для агентств и перекупщиков' },
  { name: 'Лента заявок', what: 'сообщает о новых регистрациях, каждому менеджеру — свой фильтр', who: 'для отделов продаж' },
];
