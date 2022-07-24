
interface keyable {
    [key: string]: any,
}

interface IText {
    id: number,
    author: string,
    title: string,
    meta: string,
    grammar: boolean,
    comments: boolean,
    loaded: boolean,
    published: string,
    date: string,
    credits: string,
    site: string,
    zipsize: number,
    lang: string,
    langLabel: string,
}

interface IUser {
    id: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    sex: number,
    server: string,
    commit: string,
    privs: number,
    activated: boolean,
    requested: Date,
    text_id: number,
    text?: IText,
}

interface IState {
    token?: string,
    error?: string,
    user?: IUser,
}

interface IBibTex {
    type: string,
}

interface IBib {
    id: number,
    lang: string,
    citekey: string,
    bibtex: IBibTex,
}

interface IToken {
    id: number,
    checked?: boolean,
    form: string,
    repr: string,
    meta: string,
    p: number,
    s: number,
    comments: Array<number>,
}

interface IEntry {
    long_json: Object,
    long_html: string,
    long_text: string,
    brief_json: Object,
    brief_html: string,
    brief_text: string,
    text_id: number,
    id: number,
    issues: Array<[number, number]>,
    tags: Array<number>,
    priority: number,
    published: boolean,
    trans: string,
    title: string,
}

interface IImageItem {
    id: string,
    user_id: number,
    text_id: number,
    filesize: number,
    created: Date,
    title: string
    meta: string,
    status: string,
    loaded: boolean,
    url: string,
    name: string,
}

interface IRow {
    bound: boolean,
    id: number,
    issues: Array<Array<number>>,
    tags: Array<number>,
    priority: number,
    published: null | boolean,
    title: string,
}

interface IBackup {
    filename: string,
    state: boolean,
    marked: boolean,
}

interface IIssue {
    id?: number,
    en: string,
    ru: string,
    color: string,
}

interface ITag {
    id?: number,
    en: string,
    ru: string,
}
