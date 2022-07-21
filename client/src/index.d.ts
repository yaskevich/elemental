
interface ITextObject {
    author: string,
    comments: boolean,
    grammar: boolean,
    lang: string,
    id: number,
    meta: string,
    title: string,
    loaded: boolean,
}

interface IUserObject {
    id: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    sex: number,
    server: string,
    commit: string,
    text_id: number,
    text?: ITextObject,
    privs: number,
}

interface IState {
    token?: string,
    error?: string,
    user?: IUserObject,
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
